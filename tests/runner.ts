// Minimal `process.stdout` shape we use — declared here so we don't need
// @types/node as a dev dependency.
declare const process: {
  stdout: { write: (s: string) => void };
};

/**
 * Tiny zero-dep test runner. Plays the role of vitest/jest for this project
 * without pulling in 200+MB of dev dependencies.
 *
 * Usage in a test file:
 *
 *   import { describe, test, expect } from '../tests/runner';
 *
 *   describe('myThing', () => {
 *     test('does X', () => {
 *       expect(myThing(1)).toBe(2);
 *     });
 *   });
 *
 * Run all tests with:  npm test
 */

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

interface Suite {
  name: string;
  tests: TestCase[];
  before: Array<() => void>;
}

const suites: Suite[] = [];
let currentSuite: Suite | null = null;

export function describe(name: string, body: () => void): void {
  const suite: Suite = { name, tests: [], before: [] };
  const prev = currentSuite;
  currentSuite = suite;
  try {
    body();
  } finally {
    currentSuite = prev;
  }
  suites.push(suite);
}

export function test(name: string, fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    // Allow top-level tests by creating an anonymous suite
    suites.push({ name: '<root>', tests: [{ name, fn }], before: [] });
    return;
  }
  currentSuite.tests.push({ name, fn });
}

export function beforeEach(fn: () => void): void {
  if (!currentSuite) throw new Error('beforeEach must be inside describe');
  currentSuite.before.push(fn);
}

// Minimal expect API — extend as needed.
class Expectation {
  constructor(private actual: unknown, private negated = false) {}

  get not(): Expectation {
    return new Expectation(this.actual, !this.negated);
  }

  private check(condition: boolean, message: string): void {
    const pass = this.negated ? !condition : condition;
    if (!pass) {
      throw new Error(this.negated ? `NOT ${message}` : message);
    }
  }

  toBe(expected: unknown): void {
    this.check(
      Object.is(this.actual, expected),
      `expected ${fmt(this.actual)} to be ${fmt(expected)}`,
    );
  }

  toEqual(expected: unknown): void {
    this.check(
      deepEqual(this.actual, expected),
      `expected ${fmt(this.actual)} to deep-equal ${fmt(expected)}`,
    );
  }

  toBeNull(): void {
    this.check(this.actual === null, `expected ${fmt(this.actual)} to be null`);
  }

  toBeTruthy(): void {
    this.check(!!this.actual, `expected ${fmt(this.actual)} to be truthy`);
  }

  toBeFalsy(): void {
    this.check(!this.actual, `expected ${fmt(this.actual)} to be falsy`);
  }

  toBeGreaterThan(n: number): void {
    this.check(
      typeof this.actual === 'number' && this.actual > n,
      `expected ${fmt(this.actual)} > ${n}`,
    );
  }

  toBeGreaterThanOrEqual(n: number): void {
    this.check(
      typeof this.actual === 'number' && this.actual >= n,
      `expected ${fmt(this.actual)} >= ${n}`,
    );
  }

  toBeLessThan(n: number): void {
    this.check(
      typeof this.actual === 'number' && this.actual < n,
      `expected ${fmt(this.actual)} < ${n}`,
    );
  }

  toBeLessThanOrEqual(n: number): void {
    this.check(
      typeof this.actual === 'number' && this.actual <= n,
      `expected ${fmt(this.actual)} <= ${n}`,
    );
  }

  toBeCloseTo(expected: number, precision = 2): void {
    const diff = Math.abs(Number(this.actual) - expected);
    const tolerance = Math.pow(10, -precision) / 2;
    this.check(
      diff < tolerance,
      `expected ${fmt(this.actual)} to be close to ${expected} (±${tolerance})`,
    );
  }

  toContain(item: unknown): void {
    let has: boolean;
    if (Array.isArray(this.actual)) {
      has = this.actual.includes(item as never);
    } else if (this.actual instanceof Set || this.actual instanceof Map) {
      has = this.actual.has(item as never);
    } else if (typeof this.actual === 'string') {
      has = this.actual.includes(String(item));
    } else {
      has = false;
    }
    this.check(has, `expected ${fmt(this.actual)} to contain ${fmt(item)}`);
  }
}

export function expect(actual: unknown): Expectation {
  return new Expectation(actual);
}

function fmt(v: unknown): string {
  if (v instanceof Map) return `Map(${v.size}) { ${[...v].slice(0, 4).map(([k, v]) => `${fmt(k)} => ${fmt(v)}`).join(', ')}${v.size > 4 ? ', …' : ''} }`;
  if (v instanceof Set) return `Set(${v.size}) { ${[...v].slice(0, 4).map(fmt).join(', ')}${v.size > 4 ? ', …' : ''} }`;
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'object' && v !== null) {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !deepEqual(b.get(k), v)) return false;
    return true;
  }
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!kb.includes(k)) return false;
    if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}

export async function runAll(): Promise<{ passed: number; failed: number; failures: string[] }> {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const suite of suites) {
    process.stdout.write(`\n${suite.name}\n`);
    for (const t of suite.tests) {
      try {
        for (const before of suite.before) before();
        await t.fn();
        passed++;
        process.stdout.write(`  \u2713 ${t.name}\n`);
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        failures.push(`${suite.name} > ${t.name}: ${msg}`);
        process.stdout.write(`  \u2717 ${t.name}\n     ${msg}\n`);
      }
    }
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.stdout.write(`\nFailures:\n`);
    for (const f of failures) process.stdout.write(`  - ${f}\n`);
  }
  return { passed, failed, failures };
}

// Reset state — useful when running multiple files in one process.
export function _reset(): void {
  suites.length = 0;
  currentSuite = null;
}
