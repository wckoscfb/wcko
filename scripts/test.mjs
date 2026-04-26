// Test runner entry: discovers *.test.ts files under src/ and tests/, loads
// them via jiti (so TypeScript + JSON imports just work), then invokes the
// shared runAll() collector. No vitest/jest dependency.

import { readdir } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');

async function findTests(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      out.push(...(await findTests(full)));
    } else if (e.isFile() && /\.test\.ts$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = [
  ...(await findTests(join(ROOT, 'src'))),
  ...(await findTests(join(ROOT, 'tests'))).filter(f => !f.endsWith('runner.ts')),
];

if (files.length === 0) {
  console.error('No test files found under src/ or tests/');
  process.exit(1);
}

const jiti = jitiFactory(import.meta.url, {
  interopDefault: true,
  // Cache MUST be enabled so the runner module is a singleton — otherwise
  // describe()/test() calls in the test file land on a different `suites`
  // array than the one runAll() reads from.
  cache: true,
  requireCache: true,
  esmResolve: true,
});

let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];

for (const file of files) {
  console.log(`\n=== ${relative(ROOT, file)} ===`);
  const runner = jiti(join(ROOT, 'tests/runner.ts'));
  runner._reset();
  jiti(file);
  const { passed, failed, failures } = await runner.runAll();
  totalPassed += passed;
  totalFailed += failed;
  allFailures.push(...failures);
}

console.log(`\n=== TOTAL: ${totalPassed} passed, ${totalFailed} failed ===`);
process.exit(totalFailed > 0 ? 1 : 0);
