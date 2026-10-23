import { useMemo, useState } from "react";
import { formatSize } from "../format";
import type { ScannedGame } from "../types";

interface GameViewProps {
  games: ScannedGame[];
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
  loading,
  error,
  busyId,
  status,
  onRescan,
  onBackup,
  onOpen,
}: GameViewProps) => {
  const [search, setSearch] = useState("");
  const [onlyWithSaves, setOnlyWithSaves] = useState(true);

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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Spiele</h1>
          <p className="text-sm text-neutral-500">
            {visible.length} von {games.length} Spielen
          </p>
        </div>
        <button
          type="button"
          onClick={onRescan}
          disabled={loading}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          {loading ? "Scanne …" : "Neu scannen"}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Suche
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Spiel suchen …"
            className="w-72 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={onlyWithSaves}
            onChange={(e) => setOnlyWithSaves(e.currentTarget.checked)}
          />
          Nur Spiele mit Spielständen
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Spiel</th>
              <th className="px-5 py-3 font-semibold">Launcher</th>
              <th className="px-5 py-3 font-semibold">Spielstand</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => {
              const id = entry.game.launcherId;
              return (
                <tr
                  key={id}
                  className="border-b border-neutral-100 last:border-0 align-top"
                >
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(id)}
                      className="font-semibold hover:underline"
                    >
                      {entry.game.name}
                    </button>
                    {status[id] && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {status[id]}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md border border-neutral-300 px-2 py-0.5 text-xs">
                      {entry.game.launcher}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-600">
                    {entry.files.length > 0
                      ? `${entry.files.length} Dateien, ${formatSize(entry.totalSize)}`
                      : "Keine gefunden"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {entry.files.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onBackup(id)}
                        disabled={busyId !== null}
                        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
                      >
                        {busyId === id ? "Sichere …" : "Sichern"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GamesView;
