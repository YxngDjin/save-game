import { Cloud, HardDrive, Pin, StickyNote } from "lucide-react";
import { formatDate, formatSize, reasonLabels } from "../format";
import type { Version } from "../versions";

const reasonStyles: Record<string, string> = {
  auto: "bg-accent/15 text-accent-text",
  manual: "bg-info/15 text-info",
  "pre-restore": "bg-warn/15 text-warn",
};

interface VersionRowProps {
  version: Version;
  selected: boolean;
  current: boolean;
  pinned?: boolean;
  note?: string;
  onSelect: () => void;
}

const VersionRow = ({
  version,
  selected,
  current,
  pinned = false,
  note,
  onSelect,
}: VersionRowProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left ${
        selected
          ? "border-accent bg-surface-2"
          : "border-border bg-surface hover:bg-surface-2"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{formatDate(version.createdAt)}</span>
          {version.reason && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                reasonStyles[version.reason] ?? "bg-surface-3 text-muted"
              }`}
            >
              {reasonLabels[version.reason] ?? version.reason}
            </span>
          )}
          {current && (
            <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs font-semibold">
              Aktuell
            </span>
          )}
        </div>

        <span className="text-sm text-muted">
          {version.device} · {formatSize(version.size)} · {version.fileCount}{" "}
          Dateien
        </span>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {version.local && (
            <span className="flex items-center gap-1">
              <HardDrive size={14} aria-hidden="true" />
              Lokal
            </span>
          )}
          {version.server && (
            <span className="flex items-center gap-1">
              <Cloud size={14} aria-hidden="true" />
              Server
            </span>
          )}
        </div>

        {note && (
          <span className="flex items-center gap-1.5 text-sm">
            <StickyNote size={14} aria-hidden="true" />
            {note}
          </span>
        )}
      </div>

      {pinned && (
        <Pin
          size={18}
          className="shrink-0 text-accent-text"
          aria-label="Angepinnt"
        />
      )}
    </button>
  );
};

export default VersionRow;
