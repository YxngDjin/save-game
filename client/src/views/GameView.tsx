import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { BackupSummary, ScannedGame, ServerBackup } from "../types";
import GameHeader from "../components/GameHeader";
import Tabs from "../components/Tabs";
import LocationsTab from "../components/LocationsTab";
import { mergeVersions, type Version } from "../versions";
import VersionRow from "../components/VersionRow";
import { useBackupMeta } from "../hooks/useBackupMeta";
import VersionDetail from "../components/VersionDetail";
import RestoreDialog from "../components/RestoreDialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";

type GameTab = "versions" | "locations";

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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Version | null>(null);
  const [serverBackups, setServerBackups] = useState<ServerBackup[] | null>(
    null,
  );
  const [serverError, setServerError] = useState("");
  const [tab, setTab] = useState<GameTab>("versions");
  const meta = useBackupMeta();

  const versions = useMemo(
    () => mergeVersions(localBackups ?? [], serverBackups ?? []),
    [localBackups, serverBackups],
  );

  const selected =
    versions.find((version) => version.key === selectedKey) ?? versions[0];

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

  const foundLocations = entry.locations.filter(
    (location) => location.found.length > 0,
  );

  const restore = (version: Version) => {
    setRestoreTarget(null);
    const { local, server } = version;
    if (local) {
      onTask("Stelle wieder her ...", () =>
        api.restoreBackup(id, local.fileName),
      );
    } else if (server) {
      onTask("Lade vom Server und stelle wieder her ...", () =>
        api.restoreServerBackup(id, server.id),
      );
    }
  };

  const openFolder = () => {
    const path = foundLocations[0]?.found[0];
    if (!path) return;
    onTask("Öffne Ordner …", async () => {
      await revealItemInDir(path);
      return "Ordner geöffnet";
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <GameHeader
        entry={entry}
        busy={busy}
        onBack={onBack}
        onOpenFolder={openFolder}
        onBackup={() => onTask("Sichere …", () => api.backupGame(id))}
      />

      {status && (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          {status}
        </p>
      )}

      <Tabs
        tabs={[
          { id: "versions", label: "Versionen", count: versions.length },
          {
            id: "locations",
            label: "Speicherorte",
            count: foundLocations.length,
          },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "versions" && (
        <div className="flex flex-col gap-3">
          {serverError && <p className="text-sm text-danger">{serverError}</p>}
          <div className="flex flex-wrap items-start gap-5">
            <section className="flex min-w-0 flex-[3_1_420px] flex-col gap-2">
              {localBackups === null ? (
                <p className="text-sm text-muted">Lade …</p>
              ) : versions.length === 0 ? (
                <p className="text-sm text-muted">
                  Noch keine Versionen vorhanden.
                </p>
              ) : (
                versions.map((version, index) => (
                  <VersionRow
                    key={version.key}
                    version={version}
                    current={index === 0}
                    selected={version.key === selected?.key}
                    onSelect={() => setSelectedKey(version.key)}
                    pinned={meta.isPinned(version.hash)}
                    note={meta.getNote(version.hash)}
                  />
                ))
              )}
            </section>

            <aside className="flex min-w-0 flex-[2_1_320px] flex-col gap-4 rounded-xl border border-border bg-surface p-5">
              {selected ? (
                <VersionDetail
                  version={selected}
                  note={meta.getNote(selected.hash)}
                  pinned={meta.isPinned(selected.hash)}
                  busy={busy}
                  onNoteChange={(note) => meta.setNote(selected.hash, note)}
                  onTogglePin={() => meta.togglePin(selected.hash)}
                  onRestore={() => setRestoreTarget(selected)}
                />
              ) : (
                <p className="text-sm text-muted">Wähle eine Version aus.</p>
              )}
            </aside>
          </div>
        </div>
      )}

      {tab === "locations" && (
        <LocationsTab
          locations={foundLocations}
          manifestName={entry.manifestName}
        />
      )}
      {restoreTarget && (
        <RestoreDialog
          version={restoreTarget}
          gameName={entry.game.name}
          onCancel={() => setRestoreTarget(null)}
          onConfirm={() => restore(restoreTarget)}
        />
      )}
    </div>
  );
};

export default GameView;
