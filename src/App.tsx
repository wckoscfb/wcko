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
  findR32Options3,
  getAnalyzedPath,
  getAnalyzedSideAt,
  getOpponentFeederRoot,
  getRoundMatches,
  resolveR32,
} from './logic/paths';
import { defaultScenario } from './state/scenario';
import { getScenarioFromUrl } from './state/shareLink';
import { loadAllScenarios, saveAllScenarios } from './state/storage';
import type {
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
    const target = over.data.current as { matchId?: MatchId; side?: SlotSide } | undefined;
    if (!team || !target?.matchId || !target.side) return;

    const { matchId, side } = target;

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
  }, [r32Match, scenario.analyzedTeam, setS]);

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
    if (confirm('Reset everything (current scenario)?')) setScenario(defaultScenario());
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
                Pick a group finish (1° / 2° / 3°) to begin.
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
