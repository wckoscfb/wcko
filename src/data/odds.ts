import type { TeamCode } from '../types';

/**
 * Editorial pre-tournament estimates of each team's probability of winning the
 * 2026 FIFA World Cup. Numbers are a synthesis of bookmaker consensus and FIFA
 * ranking position as of early 2026 — they are NOT official, NOT live, and
 * NOT sourced from a licensed odds provider.
 *
 * Update freely as the tournament approaches. Sum should be close to 100 (1.0)
 * but doesn't need to be exact for the head-to-head computation to work, since
 * Bradley-Terry only cares about relative magnitudes.
 *
 * To refresh: search "world cup 2026 winner odds" on a major aggregator
 * (Oddschecker, Pinnacle, Bet365, FiveThirtyEight) and adjust accordingly.
 */
export const WC_WIN_PROB: Record<TeamCode, number> = {
  // Tier 1 — top favorites (~55% combined)
  ARG: 0.13,  // defending champions
  FRA: 0.12,
  BRA: 0.11,
  ENG: 0.10,
  ESP: 0.09,

  // Tier 2 — strong contenders (~24% combined)
  GER: 0.06,
  POR: 0.06,
  NED: 0.045,
  BEL: 0.03,
  CRO: 0.025,
  URU: 0.022,

  // Tier 3 — outside shots (~13% combined)
  USA: 0.018,   // co-host advantage
  MEX: 0.015,   // co-host
  COL: 0.014,
  MAR: 0.013,
  SUI: 0.011,
  SEN: 0.011,
  CIV: 0.010,
  JPN: 0.010,
  CAN: 0.008,   // co-host
  KOR: 0.008,
  CZE: 0.007,
  AUS: 0.007,
  TUR: 0.007,
  EGY: 0.007,
  IRN: 0.006,
  AUT: 0.006,
  PAR: 0.005,
  ECU: 0.005,
  NOR: 0.005,

  // Tier 4 — long shots (combined ~8%)
  SWE: 0.004,
  GHA: 0.004,
  ALG: 0.004,
  TUN: 0.004,
  SCO: 0.004,
  IRQ: 0.003,
  BIH: 0.003,
  COD: 0.003,
  UZB: 0.003,
  PAN: 0.003,
  RSA: 0.003,
  CPV: 0.003,
  HTI: 0.002,
  NZL: 0.002,
  JOR: 0.002,
  CUW: 0.002,
  KSA: 0.002,
  QAT: 0.002,
};

/**
 * Bradley-Terry head-to-head estimate.
 * P(team A beats team B) = p_A / (p_A + p_B)
 *
 * Returned value is in [0, 100] (matches the format of the odds input).
 * Returns null if either team has no recorded WC win probability.
 */
export function bradleyTerryTopWins(topTeam: TeamCode, botTeam: TeamCode): number | null {
  const a = WC_WIN_PROB[topTeam];
  const b = WC_WIN_PROB[botTeam];
  if (a == null || b == null || a + b <= 0) return null;
  const p = a / (a + b);
  // Clamp to [0.01, 0.99] so we never produce an exact deterministic odds
  // (which would short-circuit the probability propagation in suspicious ways)
  const clamped = Math.max(0.01, Math.min(0.99, p));
  return Math.round(clamped * 100);
}
