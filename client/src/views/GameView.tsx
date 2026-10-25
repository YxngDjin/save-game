import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { formatDate, formatSize, reasonLabels } from "../format";
import type { BackupSummary, ScannedGame, ServerBackup } from "../types";
import RestoreButton from "../components/RestoreButton";

interface GameViewProps {
  entry: ScannedGame;
  paired: boolean;
  busy: boolean;
  status?: string;
  onBack: () => void;
  onTask: (pending: string, task: () => Promise<string>) => Promise<void>;
}

const GameView = ({
  entry,
  paired,
  busy,
  status,
  onBack,
  onTask,
}: GameViewProps) => {
  const id = entry.game.launcherId;
  const [localBackups, setLocalBackups] = useState<BackupSummary[] | null>(
    null,
  );
  const [serverBackups, setServerBackups] = useState<ServerBackup[] | null>(
    null,
  );
  const [serverError, setServerError] = useState("");
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLocalBackups(await api.listBackups(id));
    if (paired) {
      try {
        setServerBackups(await api.listServerBackups(entry.manifestName));
        setServerError("");
      } catch (e) {
        setServerBackups([]);
        setServerError(`${e}`);
      }
    }
  }, [id, paired, entry.manifestName]);

  useEffect(() => {
    reload();
  }, [reload, status]);

  function act(pending: string, task: () => Promise<string>) {
    setConfirmKey(null);
    onTask(pending, task);
  }

  const foundLocations = entry.locations.filter(
    (location) => location.found.length > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-muted hover:underline"
      >
        ← Alle Spiele
      </button>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{entry.game.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-md border border-border-strong px-2 py-0.5 text-xs text-text">
              {entry.game.launcher}
            </span>
            <span>App-ID {id}</span>
            <span>·</span>
            <span>
              {entry.files.length} Dateien, {formatSize(entry.totalSize)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => act("Sichere …", () => api.backupGame(id))}
          disabled={busy || entry.files.length === 0}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Jetzt sichern
        </button>
      </header>

      {status && (
        <p className="rounded-lg border border-border bg-white px-4 py-3 text-sm text-text">
          {status}
        </p>
      )}

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="mb-3 font-semibold">Gefundene Speicherorte</h2>
        {foundLocations.length === 0 ? (
          <p className="text-sm text-muted">Keine Spielstände gefunden.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {foundLocations.map((location) => (
              <li
                key={location.rawPath}
                className="rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs break-all"
              >
                {location.rawPath}
                {location.tags.length > 0 && (
                  <span className="ml-2 font-sans text-muted">
                    [{location.tags.join(", ")}]
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">
          Quelle: Ludusavi-Manifest ({entry.manifestName})
        </p>
      </section>

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="mb-3 font-semibold">Lokale Backups</h2>
        {localBackups === null && <p className="text-sm text-muted">Lade …</p>}
        {localBackups?.length === 0 && (
          <p className="text-sm text-muted">Noch keine Backups vorhanden.</p>
        )}
        <ul className="flex flex-col">
          {localBackups?.map((b) => {
            const key = `local/${b.fileName}`;
            return (
              <li
                key={key}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 py-3 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium">
                    {formatDate(b.createdAt)}
                  </div>
                  <div className="text-xs text-muted">
                    {b.fileCount} Dateien, {formatSize(b.totalSize)}
                  </div>
                </div>
                <RestoreButton
                  armed={confirmKey === key}
                  disabled={busy}
                  onArm={() => setConfirmKey(key)}
                  onCancel={() => setConfirmKey(null)}
                  onConfirm={() =>
                    act("Stelle wieder her …", () =>
                      api.restoreBackup(id, b.fileName),
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>

      {paired && (
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-3 font-semibold">Server-Backups</h2>
          {serverError && (
            <p className="text-sm bg-red-50-600">{serverError}</p>
          )}
          {serverBackups === null && (
            <p className="text-sm text-muted">Lade …</p>
          )}
          {serverBackups?.length === 0 && !serverError && (
            <p className="text-sm text-muted">Keine Backups auf dem Server.</p>
          )}
          <ul className="flex flex-col">
            {serverBackups?.map((b) => {
              const key = `server/${b.id}`;
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 py-3 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {formatDate(b.createdAt)}
                    </div>
                    <div className="text-xs text-muted">
                      {b.deviceName} · {reasonLabels[b.reason] ?? b.reason} ·{" "}
                      {b.fileCount} Dateien, {formatSize(b.sizeBytes)}
                    </div>
                  </div>
                  <RestoreButton
                    armed={confirmKey === key}
                    disabled={busy}
                    onArm={() => setConfirmKey(key)}
                    onCancel={() => setConfirmKey(null)}
                    onConfirm={() =>
                      act("Lade vom Server und stelle wieder her …", () =>
                        api.restoreServerBackup(id, b.id),
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="rounded-lg border border-dashed border-border-strong px-4 py-3 text-xs text-muted">
        Vor jedem Wiederherstellen wird dein aktueller Stand automatisch
        gesichert.
      </p>
    </div>
  );
};

export default GameView;
