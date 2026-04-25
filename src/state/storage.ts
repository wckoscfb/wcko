import type { Scenario } from '../types';

const STORAGE_KEY = 'wcko-scenarios';

export function loadAllScenarios(): Record<string, Scenario> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Scenario>;
  } catch {
    return {};
  }
}

export function saveAllScenarios(all: Record<string, Scenario>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* swallow quota errors */
  }
}
