import { useMemo, useState } from "react";
import type { ScannedGame } from "../types";
import GameCard from "../components/GameCard";
import { useRunningGame } from "../hooks/useRunningGame";
import RunningBanner from "../components/RunningBanner";

interface GamesViewProps {
  games: ScannedGame[];
  search: string;
  loading: boolean;
  error: string;
  busyId: string | null;
  status: Record<string, string>;
  onRescan: () => void;
  onBackup: (launcherId: string) => void;
  onOpen: (launcherId: string) => void;
}

const GamesView = ({
  games,
  search,
  loading,
  error,
  busyId,
  status,
  onRescan,
  onBackup,
  onOpen,
}: GamesViewProps) => {
  const [onlyWithSaves, setOnlyWithSaves] = useState(true);

  const running = useRunningGame();
  const runningKnown =
    running !== null &&
    games.some(
      (entry) =>
        entry.game.launcherId === running.launcherId && entry.files.length > 0,
    );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return games.filter(
      (entry) =>
        (!onlyWithSaves || entry.files.length > 0) &&
        (term === "" || entry.game.name.toLowerCase().includes(term)),
    );
  }, [games, search, onlyWithSaves]);

  return (
    <div className="flex flex-col gap-6">
      {running && (
        <RunningBanner
          game={running}
          known={runningKnown}
          busy={busyId !== null}
          onBackup={() => onBackup(running.launcherId)}
          onOpen={() => onOpen(running.launcherId)}
        />
      )}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Spiele</h1>
          <p className="text-sm text-muted">
            {visible.length} von {games.length} Spielen
          </p>
        </div>
        <button
          type="button"
          onClick={onRescan}
          disabled={loading}
          className="rounded-lg border border-border-strong bg-surface hover:bg-surface-2 px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Scanne …" : "Neu scannen"}
        </button>
      </header>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyWithSaves}
          className="accent-accent"
          onChange={(e) => setOnlyWithSaves(e.currentTarget.checked)}
        />
        Nur Spiele mit Spielständen
      </label>

      {error && (
        <p className="rounded-lg border border-danger/30 px-4 py-3 text-sm text-danger bg-danger/10">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted">
          Keine Spiele gefunden.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-4">
          {visible.map((item) => {
            const id = item.game.launcherId;
            return (
              <GameCard
                key={id}
                entry={item}
                status={status[id]}
                busy={busyId !== null}
                saving={busyId === id}
                onOpen={() => onOpen(id)}
                onBackup={() => onBackup(id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GamesView;
