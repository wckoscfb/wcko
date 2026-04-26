import type { Scenario } from '../types';
import { defaultScenario } from './scenario';

/**
 * Encode a scenario into a URL-safe string for sharing.
 * Strategy: JSON.stringify -> UTF-8 -> base64 -> URL-safe variant.
 *
 * Average size for a fully-filled scenario: ~400-700 chars after encoding.
 * Well within URL length limits (~2000 chars practical max).
 */
function encodeScenario(s: Scenario): string {
  // Strip the scenario name from shared payload — names are personal to the saver
  const payload: Scenario = { ...s, scenarioName: '' };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeScenario(encoded: string): Scenario | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const parsed = JSON.parse(json) as Partial<Scenario>;
    return { ...defaultScenario(), ...parsed };
  } catch {
    return null;
  }
}

/** Reads ?s=... from the current URL. */
export function getScenarioFromUrl(): Scenario | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const s = params.get('s');
  if (!s) return null;
  return decodeScenario(s);
}

/** Builds a shareable URL using the current origin. */
export function buildShareUrl(s: Scenario): string {
  const encoded = encodeScenario(s);
  const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${origin}?s=${encoded}`;
}
