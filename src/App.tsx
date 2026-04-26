import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState, Footer } from './components/EmptyState';
import { FlagImg } from './components/FlagImg';
import { GroupCard } from './components/GroupCard';
import { LeftRail } from './components/LeftRail';
import { RoundCard } from './components/RoundCard';
import { TopBar } from './components/TopBar';
import { ROUND_ORDER } from './data/bracket';
import { TEAM_BY_CODE } from './data/teams';
import { eligibleForMatchSide } from './logic/eligibility';
import {
  areOnSamePath,
  collectSubtreeByRound,
  findR32Options3,
  getAnalyzedPath,
  getAnalyzedSideAt,
  getOpponentFeederRoot,
  getRoundMatches,
  resolveR32,
} from './logic/paths';
import { useT } from './i18n/context';
import { computeSurvivalChain } from './logic/probability';
import { defaultScenario } from './state/scenario';
import { getScenarioFromUrl } from './state/shareLink';
import { loadAllScenarios, saveAllScenarios } from './state/storage';
import type {
  DropTargetData,
  GroupFinish,
  MatchId,
  R32SlotPosition,
  Round,
  Scenario,
  SlotSide,
  TeamCode,
} from './types';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

export default function App() {
  const t = useT();
  const [scenario, setScenario] = useState<Scenario>(defaultScenario);
  const [savedScenarios, setSavedScenarios] = useState<Record<string, Scenario>>({});
  const [draggedTeam, setDraggedTeam] = useState<TeamCode | null>(null);
  const isMobile = useIsMobile();

  // On mount: load saved scenarios + apply ?s=... share link if present
  useEffect(() => {
    setSavedScenarios(loadAllScenarios());
    const fromUrl = getScenarioFromUrl();
    if (fromUrl) {
      setScenario(fromUrl);
      // Clean URL so reloading doesn't re-apply
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch { /* noop */ }
    }
  }, []);

  const setS = useCallback((updater: Partial<Scenario> | ((prev: Scenario) => Scenario)) => {
    setScenario(prev => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  }, []);

  // R32 slot for analyzed team (derived from team + finish + thirdR32)
  const r32Match: R32SlotPosition | null = useMemo(
    () => resolveR32(scenario.analyzedTeam, scenario.groupFinish, scenario.thirdR32),
    [scenario.analyzedTeam, scenario.groupFinish, scenario.thirdR32],
  );

  const thirdsOptions = useMemo(
    () => (scenario.analyzedTeam && scenario.groupFinish === '3'
      ? findR32Options3(scenario.analyzedTeam) : []),
    [scenario.analyzedTeam, scenario.groupFinish],
  );

  const analyzedPath = useMemo(() => getAnalyzedPath(r32Match?.matchId ?? null), [r32Match]);
  const roundMatches = useMemo(() => getRoundMatches(r32Match?.matchId ?? null), [r32Match]);

  const opponentFeederRoots = useMemo(() => {
    if (!roundMatches) return null;
    const out: Partial<Record<Round, MatchId | null>> = {};
    for (const r of ROUND_ORDER) {
      out[r] = r === 'R32' ? null : getOpponentFeederRoot(roundMatches[r], analyzedPath);
    }
    return out as Record<Round, MatchId | null>;
  }, [roundMatches, analyzedPath]);

  // First empty slot in any visible opponent feeder — drives the one-shot
  // "you can drop a team here" hint (shown on this slot only, not every empty
  // slot, so it reads as a tutorial cue rather than constant chatter).
  // Priority: the user's own R32 opponent slot first, then deeper rounds.
  const hintSlotKey = useMemo<string | null>(() => {
    if (!opponentFeederRoots) return null;
    // R32: the analyzed team's own match — opponent side is whichever isn't analyzed.
    if (roundMatches && r32Match) {
      const r32Mid = roundMatches.R32;
      if (r32Mid) {
        const oppSide = r32Match.side === 'A' ? 'B' : 'A';
        const key = `${r32Mid}.${oppSide}`;
        if (!scenario.placements[key]) return key;
      }
    }
    for (const r of ROUND_ORDER) {
      if (r === 'R32') continue;
      const root = opponentFeederRoots[r];
      if (!root) continue;
      const subtree = collectSubtreeByRound(root);
      for (const subRound of ROUND_ORDER) {
        for (const mid of [...subtree[subRound]].sort()) {
          for (const side of ['A', 'B'] as const) {
            const key = `${mid}.${side}`;
            if (!scenario.placements[key]) return key;
          }
        }
      }
    }
    return null;
  }, [opponentFeederRoots, scenario.placements, roundMatches, r32Match]);

  // Auto-place analyzed team in their R32 slot whenever the slot changes
  useEffect(() => {
    if (!r32Match) return;
    setS(prev => {
      if (!prev.analyzedTeam) return prev;
      const key = `${r32Match.matchId}.${r32Match.side}`;
      if (prev.placements[key] === prev.analyzedTeam) return prev;
      const placements = { ...prev.placements };
      // Remove any prior placement of analyzed team in a different slot
      for (const k of Object.keys(placements)) {
        if (placements[k] === prev.analyzedTeam && k !== key) delete placements[k];
      }
      placements[key] = prev.analyzedTeam;
      return { ...prev, placements };
    });
  }, [r32Match, setS]);

  const placedTeams = useMemo(
    () => new Set(Object.values(scenario.placements).filter(Boolean) as TeamCode[]),
    [scenario.placements],
  );

  // Same semantics as `placedTeams` for now (every placement implies a locked
  // group/position commitment). Kept as a separate alias so the *intent* at
  // call sites is clear: this is what to filter from group/thirds estimates.
  // The analyzed team is already in placements (auto-placed at their R32 slot
  // by the effect above) so we don't need to add them separately.
  // MUST be declared BEFORE any useMemo that reads it — see the TDZ bug
  // that black-screened the app when picking a team from EmptyState.
  const excludeFromEstimates = placedTeams;

  // Per-round win probability — drives the "From here, X% to reach R16…" panel
  const survivalChain = useMemo(() => {
    if (!scenario.analyzedTeam || !roundMatches || !opponentFeederRoots) return null;
    return computeSurvivalChain(
      scenario.analyzedTeam,
      roundMatches,
      (matchId) => getAnalyzedSideAt(matchId, analyzedPath, r32Match),
      opponentFeederRoots,
      scenario.placements,
      scenario.odds,
      scenario.useEstimatedOdds,
      // Exclude every placed team from opponent estimation — each one is
      // locked at a specific (group, position) and can't simultaneously
      // appear in any other group/thirds slot estimate.
      excludeFromEstimates,
    );
  }, [
    scenario.analyzedTeam, roundMatches, opponentFeederRoots, analyzedPath, r32Match,
    scenario.placements, scenario.odds, scenario.useEstimatedOdds, excludeFromEstimates,
  ]);

  /* ============== Drag-and-drop ============== */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Touch: 200ms hold before drag starts so short taps still scroll the page
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const team = event.active.data.current?.team as TeamCode | undefined;
    if (team) setDraggedTeam(team);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggedTeam(null);
    const { active, over } = event;
    if (!over) return;

    const team = active.data.current?.team as TeamCode | undefined;
    const target = over.data.current as DropTargetData | undefined;
    if (!team || !target) return;

    // Resolve every drop-target kind down to a concrete (matchId, side) pair.
    // Switching on `target.kind` lets TS catch any new drop kind that isn't
    // handled here.
    let matchId: MatchId;
    let side: SlotSide;
    switch (target.kind) {
      case 'slot':
        matchId = target.matchId;
        side = target.side;
        break;
      case 'oppslot': {
        // The R16+ "your match" opponent slot resolves at drop time to the
        // R32 leaf in the opponent feeder subtree where this team's
        // group / finish position fits.
        if (!opponentFeederRoots) return;
        let feederRoot: MatchId | null = null;
        for (const r of ROUND_ORDER) {
          if (roundMatches?.[r] === target.roundMatchId) {
            feederRoot = opponentFeederRoots[r] ?? null;
            break;
          }
        }
        if (!feederRoot) return;
        const subtree = collectSubtreeByRound(feederRoot);
        let resolved: { matchId: MatchId; side: SlotSide } | null = null;
        for (const leafMid of [...subtree.R32].sort()) {
          for (const s of ['A', 'B'] as const) {
            if (eligibleForMatchSide(leafMid, s).has(team)) {
              resolved = { matchId: leafMid, side: s };
              break;
            }
          }
          if (resolved) break;
        }
        if (!resolved) return;
        matchId = resolved.matchId;
        side = resolved.side;
        break;
      }
      default: {
        // Exhaustiveness check — TypeScript flags this if a new DropTargetData
        // variant is added without a matching case above.
        const _exhaustive: never = target;
        void _exhaustive;
        return;
      }
    }

    // Check eligibility (defense in depth — useDroppable should already filter)
    if (!eligibleForMatchSide(matchId, side).has(team)) return;

    // Don't allow overwriting analyzed team's locked R32 slot with someone else
    if (
      r32Match &&
      matchId === r32Match.matchId &&
      side === r32Match.side &&
      team !== scenario.analyzedTeam
    ) {
      return;
    }

    setS(prev => {
      const placements = { ...prev.placements };
      const key = `${matchId}.${side}`;
      // De-dupe: clear other placements of this team UNLESS they're on the same
      // bracket path (ancestor/descendant = natural team progression).
      for (const k of Object.keys(placements)) {
        if (placements[k] !== team || k === key) continue;
        const oldMatchId = k.split('.')[0];
        const oldSide = k.split('.')[1] as SlotSide;
        const isLockedR32 = !!r32Match && oldMatchId === r32Match.matchId && oldSide === r32Match.side;
        if (isLockedR32) continue;
        if (!areOnSamePath(matchId, oldMatchId)) delete placements[k];
      }
      placements[key] = team;
      return { ...prev, placements };
    });
  }, [r32Match, scenario.analyzedTeam, setS, opponentFeederRoots, roundMatches]);

  const handleDragCancel = useCallback(() => setDraggedTeam(null), []);

  const handleClear = useCallback((matchId: MatchId, side: SlotSide) => {
    setS(prev => {
      if (r32Match && matchId === r32Match.matchId && side === r32Match.side) return prev;
      const placements = { ...prev.placements };
      delete placements[`${matchId}.${side}`];
      return { ...prev, placements };
    });
  }, [r32Match, setS]);

  const handleOddsChange = useCallback((matchId: MatchId, value: string) => {
    setS(prev => {
      const odds = { ...prev.odds };
      if (value === '' || value === null || value === undefined) delete odds[matchId];
      else odds[matchId] = value;
      return { ...prev, odds };
    });
  }, [setS]);

  /* ============== Top bar handlers ============== */

  const handleTeamChange = (code: TeamCode | null) => {
    setS({
      analyzedTeam: code,
      groupFinish: code ? '1' : null,
      thirdR32: null,
      placements: {},
      odds: {},
      autoAdvance: { R32: true, R16: true, QF: true, SF: true, Final: true },
    });
  };
  const handleFinishChange = (pos: GroupFinish) => {
    setS({ groupFinish: pos, thirdR32: null, placements: {}, odds: {} });
  };
  const handleThirdChange = (matchId: MatchId) => {
    setS({ thirdR32: matchId, placements: {}, odds: {} });
  };

  const handleClearAll = () => {
    if (confirm(t('topbar.reset_confirm'))) setScenario(defaultScenario());
  };
  const handleSave = () => {
    const name = scenario.scenarioName.trim();
    if (!name) return;
    const all = { ...savedScenarios, [name]: scenario };
    saveAllScenarios(all);
    setSavedScenarios(all);
  };
  const handleLoad = (name: string) => {
    const s = savedScenarios[name];
    if (s) setScenario({ ...defaultScenario(), ...s, scenarioName: name });
  };
  const handleDelete = (name: string) => {
    const all = { ...savedScenarios };
    delete all[name];
    saveAllScenarios(all);
    setSavedScenarios(all);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-full flex flex-col" style={{ height: '100dvh' }}>
        <TopBar
          scenario={scenario}
          onTeamChange={handleTeamChange}
          onFinishChange={handleFinishChange}
          thirdsOptions={thirdsOptions}
          onThirdChange={handleThirdChange}
          resolvedR32={r32Match}
          onToggleEstimatedOdds={(v) => setS({ useEstimatedOdds: v })}
          scenarioName={scenario.scenarioName}
          onNameChange={(v) => setS({ scenarioName: v })}
          onSave={handleSave}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onClear={handleClearAll}
          savedNames={Object.keys(savedScenarios)}
        />

        {/* Mobile: palette as horizontal strip across the top.
            Desktop: palette as fixed left rail. */}
        {isMobile && <LeftRail placedTeams={placedTeams} compact />}

        <div className="flex-1 flex overflow-hidden">
          {!isMobile && <LeftRail placedTeams={placedTeams} />}

          <main className="flex-1 overflow-auto p-3 sm:p-4">
            {!scenario.analyzedTeam ? (
              <EmptyState onTeamPick={handleTeamChange} />
            ) : !scenario.groupFinish ? (
              <div className="text-center text-gray-600 mt-12">
                {t('finish.prompt')}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 max-w-full">
                <GroupCard analyzedTeam={scenario.analyzedTeam} />
                {roundMatches && opponentFeederRoots && ROUND_ORDER.map((r) => {
                  return (
                    <RoundCard
                      key={r}
                      round={r}
                      roundMatchId={roundMatches[r]}
                      analyzedTeam={scenario.analyzedTeam!}
                      analyzedSide={getAnalyzedSideAt(roundMatches[r], analyzedPath, r32Match)}
                      opponentFeederRoot={opponentFeederRoots[r]}
                      placements={scenario.placements}
                      odds={scenario.odds}
                      useEstimatedOdds={scenario.useEstimatedOdds}
                      excludeFromEstimates={excludeFromEstimates}
                      survivalChain={survivalChain}
                      hintSlotKey={hintSlotKey}
                      onClear={handleClear}
                      onOddsChange={handleOddsChange}
                      draggedTeam={draggedTeam}
                    />
                  );
                })}
                <Footer />
              </div>
            )}
          </main>
        </div>

        {/* Mobile: pinned "you're dragging X" pill so user knows what's selected */}
        {isMobile && draggedTeam && (
          <div
            className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium pointer-events-none"
          >
            <FlagImg code={draggedTeam} />
            <span>Dragging {TEAM_BY_CODE[draggedTeam]?.name}</span>
          </div>
        )}
      </div>

      {/* Floating drag preview */}
      <DragOverlay dropAnimation={null}>
        {draggedTeam ? (
          <div className="bg-white shadow-lg rounded-md px-3 py-2 flex items-center gap-2 text-sm border-2 border-blue-500 cursor-grabbing">
            <FlagImg code={draggedTeam} />
            <span>{TEAM_BY_CODE[draggedTeam]?.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
