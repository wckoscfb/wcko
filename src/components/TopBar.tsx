import { useState } from 'react';
import { TEAMS, flagEmoji } from '../data/teams';
import { useLang, useT } from '../i18n/context';
import { buildShareUrl } from '../state/shareLink';
import type { GroupFinish, MatchId, R32SlotPosition, Scenario, TeamCode } from '../types';
import { LangSwitcher } from './LangSwitcher';

interface Props {
  scenario: Scenario;
  onTeamChange: (code: TeamCode | null) => void;
  onFinishChange: (pos: GroupFinish) => void;
  thirdsOptions: R32SlotPosition[];
  onThirdChange: (matchId: MatchId) => void;
  resolvedR32: R32SlotPosition | null;
  onToggleEstimatedOdds: (value: boolean) => void;
  scenarioName: string;
  onNameChange: (v: string) => void;
  onSave: () => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onClear: () => void;
  savedNames: string[];
}

export function TopBar({
  scenario, onTeamChange, onFinishChange,
  thirdsOptions, onThirdChange, resolvedR32,
  onToggleEstimatedOdds,
  scenarioName, onNameChange,
  onSave, onLoad, onDelete, onClear,
  savedNames,
}: Props) {
  const t = useT();
  const { teamName } = useLang();
  const [shareCopied, setShareCopied] = useState(false);

  const finishLabel = (p: GroupFinish): string => (
    p === '1' ? t('finish.first') : p === '2' ? t('finish.second') : t('finish.third')
  );

  const handleShare = async () => {
    const url = buildShareUrl(scenario);
    try {
      // Prefer Web Share on mobile
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ title: t('topbar.share_title'), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Fallback: prompt
      window.prompt(t('topbar.share_copy_prompt'), url);
    }
  };

  return (
    <header className="bg-white border-b px-3 py-2 flex items-center gap-2 sm:gap-3 flex-wrap shadow-sm">
      <button
        onClick={() => onTeamChange(null)}
        className="flex items-center gap-2 hover:opacity-80 active:opacity-70 transition-opacity rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        title={t('topbar.back_home')}
        aria-label={t('topbar.back_home_aria')}
      >
        <img
          src="/icon-192.png"
          alt=""
          width="32"
          height="32"
          className="w-8 h-8 rounded-md flex-shrink-0"
        />
        <span
          className="font-extrabold text-lg hidden sm:inline tracking-tight"
          style={{
            color: '#1e3a8a',
            WebkitTextStroke: '0.6px #10b981',
          }}
        >WCKO</span>
      </button>
      <select
        value={scenario.analyzedTeam || ''}
        onChange={(e) => onTeamChange(e.target.value || null)}
        className="border rounded px-2 py-1 text-sm min-w-0 max-w-[180px] sm:max-w-none"
      >
        <option value="">— {t('topbar.team_placeholder')} —</option>
        {TEAMS.map(team => (
          <option key={team.code} value={team.code}>
            {flagEmoji(team.code)} {teamName(team.code)} ({t('group.label', { letter: team.group })})
          </option>
        ))}
      </select>
      {scenario.analyzedTeam && (
        <div className="flex items-center gap-1" title={t('finish.tooltip')}>
          {(['1','2','3'] as GroupFinish[]).map(p => (
            <button
              key={p}
              onClick={() => onFinishChange(p)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                scenario.groupFinish === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >{finishLabel(p)}</button>
          ))}
        </div>
      )}
      {scenario.groupFinish === '3' && thirdsOptions.length > 1 && (
        <label className="text-xs text-gray-600 flex items-center gap-1">
          {t('finish.third')}→
          <select
            value={resolvedR32?.matchId || ''}
            onChange={(e) => onThirdChange(e.target.value)}
            className="border rounded px-1 py-0.5 text-xs"
          >
            {thirdsOptions.map(o => (
              <option key={o.matchId} value={o.matchId}>{o.matchId}</option>
            ))}
          </select>
        </label>
      )}
      <LangSwitcher />

      <button
        onClick={onClear}
        className="px-2 py-1 text-xs text-gray-600 border rounded hover:bg-gray-50"
      >{t('topbar.reset')}</button>

      <label
        className="flex items-center gap-1.5 px-2 py-1 text-xs border rounded cursor-pointer select-none hover:bg-gray-50"
        title={t('topbar.auto_estimate_title')}
      >
        <input
          type="checkbox"
          checked={scenario.useEstimatedOdds}
          onChange={(e) => onToggleEstimatedOdds(e.target.checked)}
          className="w-3.5 h-3.5"
        />
        <span>{t('topbar.auto_estimate')}</span>
      </label>

      <div className="ml-auto flex items-center gap-2 flex-wrap">
        <button
          onClick={handleShare}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          disabled={!scenario.analyzedTeam}
        >
          {shareCopied ? `✓ ${t('topbar.share_copied')}` : t('topbar.share')}
        </button>
        <input
          value={scenarioName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('topbar.scenario_placeholder')}
          className="border rounded px-2 py-1 text-sm w-32 sm:w-40"
        />
        <button
          onClick={onSave}
          disabled={!scenarioName.trim()}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >{t('topbar.save')}</button>
        <select
          value=""
          onChange={(e) => { if (e.target.value) onLoad(e.target.value); }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">{t('topbar.load')}</option>
          {savedNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {savedNames.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && confirm(`${t('topbar.delete')} "${e.target.value}"?`)) onDelete(e.target.value);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">{t('topbar.delete')}…</option>
            {savedNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>
    </header>
  );
}
