export function EmptyState() {
  return (
    <div className="text-center mt-12 sm:mt-16 max-w-lg mx-auto px-4">
      <div className="text-5xl mb-4">⚽</div>
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        WCKO — Predict every team’s path to the Glory
      </h2>
      <p className="text-sm text-gray-600">
        Pick a team and a group finish, drag flags into opponent slots, set odds, and see who they might face to lift the trophy.
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="text-center text-[10px] text-gray-400 py-4 px-4">
      WCKO · scenarios saved to your browser · not affiliated with or endorsed by FIFA
    </footer>
  );
}
