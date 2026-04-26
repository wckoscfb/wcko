/**
 * The 12×12 lock icon shown next to the analyzed team's flag in any slot
 * where they're locked (R32 own slot, R16+ "your match" panel, etc.).
 *
 * Extracted so visual tweaks happen in one place — the icon renders inside
 * MatchBox.Slot and RoundMatchBox alike.
 */
export function LockBadge() {
  return (
    <span
      className="text-blue-600 flex-shrink-0"
      title="Your analyzed team — locked across every round"
      aria-label="Your team — locked"
    >
      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}
