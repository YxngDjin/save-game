import { useMemo, useState } from "react";
import { useHistory, type HistoryEntry } from "../hooks/useHistory";
import { useBackupMeta } from "../hooks/useBackupMeta";
import { groupLabel, timeLabel } from "../history";
import HistoryRow from "../components/HistoryRow";
import { formatSize } from "../format";
import type { ScannedGame } from "../types";

const PAGE_SIZE = 30;
const groupOrder = ["Heute", "Gestern", "Diese Woche", "Älter"];
const reasonFilters = [
  { id: "all", label: "Alle" },
  { id: "auto", label: "Automatisch" },
  { id: "manual", label: "Manuell" },
  { id: "pre-restore", label: "Vor Wiederherstellung" },
];

interface HistoryViewProps {
  games: ScannedGame[];
  paired: boolean;
  onOpen: (launcherId: string, versionKey: string) => void;
}

const HistoryView = ({ games, paired, onOpen }: HistoryViewProps) => {
  const entries = useHistory(games, paired);
  const meta = useBackupMeta();
  const [now] = useState(() => new Date());
  const [reason, setReason] = useState("all");
  const [device, setDevice] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const devices = useMemo(
    () => [...new Set((entries ?? []).map((entry) => entry.version.device))],
    [entries],
  );

  const filtered = useMemo(
    () =>
      (entries ?? []).filter(
        (entry) =>
          (reason === "all" || entry.version.reason === reason) &&
          (device === "all" || entry.version.device === device),
      ),
    [entries, reason, device],
  );

  const groups = useMemo(() => {
    const byLabel = new Map<string, HistoryEntry[]>();
    for (const entry of filtered.slice(0, limit)) {
      const label = groupLabel(entry.version.createdAt, now);
      byLabel.set(label, [...(byLabel.get(label) ?? []), entry]);
    }
    return groupOrder
      .filter((label) => byLabel.has(label))
      .map((label) => ({ label, items: byLabel.get(label) ?? [] }));
  }, [filtered, limit, now]);

  const week = useMemo(() => {
    const recent = (entries ?? []).filter(
      (entry) => groupLabel(entry.version.createdAt, now) !== "Älter",
    );
    return {
      count: recent.length,
      size: recent.reduce((sum, entry) => sum + entry.version.size, 0),
      games: new Set(recent.map((entry) => entry.game.game.launcherId)).size,
    };
  }, [entries, now]);

  const chip = (active: boolean) =>
    `h-9 rounded-full border px-3.5 text-sm font-medium ${
      active
        ? "border-text bg-text text-bg"
        : "border-border bg-surface hover:bg-surface-2"
    }`;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold">Verlauf</h1>
        <p className="text-sm text-muted">
          Alle Sicherungen über alle Spiele und Geräte, die neuesten zuerst.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        <div className="flex flex-col rounded-xl border border-border bg-surface px-4 py-3.5">
          <span className="text-xs text-muted">Letzte 7 Tage</span>
          <span className="font-display text-2xl font-bold">
            {week.count} Sicherungen
          </span>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-surface px-4 py-3.5">
          <span className="text-xs text-muted">Gesichert</span>
          <span className="font-display text-2xl font-bold">
            {formatSize(week.size)}
          </span>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-surface px-4 py-3.5">
          <span className="text-xs text-muted">Spiele</span>
          <span className="font-display text-2xl font-bold">{week.games}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Auslöser"
          className="flex flex-wrap gap-2"
        >
          {reasonFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={reason === filter.id}
              onClick={() => setReason(filter.id)}
              className={chip(reason === filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Gerät
          <select
            value={device}
            onChange={(e) => setDevice(e.currentTarget.value)}
            className="h-9 rounded-lg border border-border-strong bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">Alle Geräte</option>
            {devices.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {entries === null ? (
        <p className="text-sm text-muted">Lade Verlauf …</p>
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted">
          Keine Sicherungen für diese Auswahl.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.label} className="flex flex-col">
            <h2 className="mb-2 pl-19 text-xs font-bold tracking-wide uppercase">
              {group.label}{" "}
              <span className="font-normal text-muted normal-case">
                {group.items.length}
              </span>
            </h2>
            <ul className="flex flex-col">
              {group.items.map((entry) => (
                <HistoryRow
                  key={`${entry.game.game.launcherId}/${entry.version.key}`}
                  entry={entry}
                  time={timeLabel(entry.version.createdAt, group.label)}
                  note={meta.getNote(entry.version.hash)}
                  pinned={meta.isPinned(entry.version.hash)}
                  onOpen={() =>
                    onOpen(entry.game.game.launcherId, entry.version.key)
                  }
                />
              ))}
            </ul>
          </section>
        ))
      )}

      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((current) => current + PAGE_SIZE)}
          className="h-11 self-center rounded-lg border border-border-strong bg-surface px-5 text-sm font-medium hover:bg-surface-2"
        >
          Ältere laden
        </button>
      )}
    </div>
  );
};

export default HistoryView;
