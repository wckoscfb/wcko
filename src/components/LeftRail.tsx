import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GROUPS, TEAM_BY_CODE } from '../data/teams';
import type { GroupLetter, TeamCode } from '../types';
import { FlagImg } from './FlagImg';

interface PaletteItemProps {
  code: TeamCode;
  isPlaced: boolean;
  /** Compact = mobile (smaller width, no full team name) */
  compact?: boolean;
}

function PaletteItem({ code, isPlaced, compact = false }: PaletteItemProps) {
  const team = TEAM_BY_CODE[code];
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${code}`,
    data: { team: code, originSlot: null },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  if (compact) {
    // Mobile pill: bigger flag (lg), tight 3-letter code, generous touch padding
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`no-callout flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] bg-gray-50 border border-gray-200 cursor-grab active:cursor-grabbing touch-none ${
          isPlaced ? 'opacity-40' : ''
        }`}
        title={`${team.name} (${team.code})`}
      >
        <FlagImg code={code} size="md" />
        <span className="font-mono font-semibold text-gray-700">{team.code}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`no-callout flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-grab active:cursor-grabbing touch-none hover:bg-blue-50 ${
        isPlaced ? 'opacity-40' : ''
      }`}
      title={`${team.name} (${team.code})`}
    >
      <FlagImg code={code} />
      <span className="truncate">{team.name}</span>
      <span className="ml-auto text-gray-400 text-[10px]">{team.code}</span>
    </div>
  );
}

interface Props {
  placedTeams: Set<TeamCode>;
  /** When true, render compact horizontal layout for mobile */
  compact?: boolean;
}

export function LeftRail({ placedTeams, compact = false }: Props) {
  if (compact) {
    // Mobile: ONE horizontal scroll. Each group is a tight 2x2 cluster
    // with the group label centered between the two flag rows. Less
    // total side-scrolling than two separate rows, more visual structure
    // per group (you see all 4 teams together), bigger touch padding
    // between group clusters so users can scroll without grabbing a flag.
    const all = Object.keys(GROUPS) as GroupLetter[];

    return (
      <aside className="bg-white border-b shrink-0 scrollable-x">
        <div className="flex gap-5 px-3 py-2 min-w-max">
          {all.map(g => {
            const teams = GROUPS[g];
            return (
              <div key={g} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="flex gap-1.5">
                  <PaletteItem code={teams[0]} isPlaced={placedTeams.has(teams[0])} compact />
                  <PaletteItem code={teams[1]} isPlaced={placedTeams.has(teams[1])} compact />
                </div>
                <div className="text-[10px] font-bold text-gray-500 tracking-wide leading-none py-0.5">
                  Group {g}
                </div>
                <div className="flex gap-1.5">
                  <PaletteItem code={teams[2]} isPlaced={placedTeams.has(teams[2])} compact />
                  <PaletteItem code={teams[3]} isPlaced={placedTeams.has(teams[3])} compact />
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r overflow-y-auto p-2 flex-shrink-0">
      <h2 className="text-sm font-semibold mb-1 px-1">Teams</h2>
      <p className="text-[10px] text-gray-500 px-1 mb-2 leading-snug">
        Drag a flag onto any highlighted slot.
      </p>
      {(Object.keys(GROUPS) as GroupLetter[]).map(g => (
        <div key={g} className="mb-2">
          <div className="text-xs font-semibold text-gray-700 px-1 py-1 border-b">Group {g}</div>
          {GROUPS[g].map(code => (
            <PaletteItem key={code} code={code} isPlaced={placedTeams.has(code)} />
          ))}
        </div>
      ))}
    </aside>
  );
}
