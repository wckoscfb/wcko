import type { Scenario } from '../types';

export function defaultScenario(): Scenario {
  return {
    analyzedTeam: null,
    groupFinish: null,
    thirdR32: null,
    autoAdvance: { R32: true, R16: true, QF: true, SF: true, Final: true },
    placements: {},
    odds: {},
    useEstimatedOdds: true,    // sensible default: auto-estimates via BT everywhere
    scenarioName: '',
  };
}
