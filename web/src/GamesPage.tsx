import { Fragment, useEffect, useState } from "react";
import { api, errorMessage } from "./api";
import { formatDate, formatSize, reasonLabels } from "./format";
import type { AdminBackup, AdminGame } from "./types";

function GameBackups({ gameId }: { gameId: string }) {
  const [backups, setBackups] = useState<AdminBackup[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.gameBackups(gameId).then(
      (list) => {
        if (!cancelled) setBackups(list);
      },
      (e) => {
        if (!cancelled) setError(errorMessage(e));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!backups) return <p className="text-sm text-neutral-500">Lade …</p>;

  return (
    <ul className="flex flex-col">
      {backups.map((b) => (
        <li
          key={b.id}
          className="flex flex-wrap justify-between gap-2 border-b border-neutral-100 py-2 text-sm last:border-0"
        >
          <span className="font-medium">{formatDate(b.createdAt)}</span>
          <span className="text-neutral-500">
            {b.deviceName} · {reasonLabels[b.reason] ?? b.reason} ·{" "}
            {b.fileCount} Dateien, {formatSize(b.sizeBytes)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function GamesPage() {
  const [games, setGames] = useState<AdminGame[] | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.games().then(
      (list) => {
        if (!cancelled) setGames(list);
      },
      (e) => {
        if (!cancelled) setError(errorMessage(e));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const totalBackups =
    games?.reduce((sum, game) => sum + game.backupCount, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Spiele</h1>
        <p className="text-sm text-neutral-500">
          {games
            ? `${games.length} Spiele, ${totalBackups} Backups auf diesem Server`
            : "Lade …"}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {games?.length === 0 && (
        <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          Noch keine Backups. Kopple unter „Geräte" einen PC und sichere ein
          Spiel.
        </p>
      )}

      {games && games.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full min-w-140 text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Spiel</th>
                <th className="px-5 py-3 font-semibold">Backups</th>
                <th className="px-5 py-3 font-semibold">Letztes Backup</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => {
                const expanded = expandedId === game.id;
                return (
                  <Fragment key={game.id}>
                    <tr className="border-b border-neutral-100">
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : game.id)
                          }
                          aria-expanded={expanded}
                          className="flex items-center gap-2 font-semibold hover:underline"
                        >
                          <span className="text-neutral-400">
                            {expanded ? "▾" : "▸"}
                          </span>
                          {game.displayName}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {game.backupCount}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {game.latestBackup
                          ? `${formatDate(game.latestBackup.createdAt)} · ${formatSize(game.latestBackup.sizeBytes)}`
                          : "–"}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-neutral-100 bg-bg">
                        <td colSpan={3} className="px-5 py-3">
                          <GameBackups gameId={game.id} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
