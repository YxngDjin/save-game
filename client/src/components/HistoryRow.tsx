import { Cloud, HardDrive, Pin, StickyNote } from "lucide-react";
import GameImage from "./GameImage";
import { useGameArt } from "../hooks/useGameArt";
import { formatSize, reasonLabels, reasonStyles } from "../format";
import type { HistoryEntry } from "../hooks/useHistory";

interface HistoryRowProps {
  entry: HistoryEntry;
  time: string;
  note: string;
  pinned: boolean;
  onOpen: () => void;
}

const HistoryRow = ({ entry, time, note, pinned, onOpen }: HistoryRowProps) => {
  const { game, version } = entry;
  const art = useGameArt(game.game.launcherId, game.game.launcher);
  const style = version.reason ? reasonStyles[version.reason] : undefined;

  return (
    <li className="flex items-stretch gap-3">
      <span className="w-12 shrink-0 pt-6 text-right font-mono text-xs text-muted">
        {time}
      </span>

      <div
        className="relative flex w-4 shrink-0 justify-center"
        aria-hidden="true"
      >
        <div className="absolute inset-y-0 w-0.5 bg-border" />
        <span
          className={`relative mt-6 h-2.5 w-2.5 rounded-full ring-4 ring-bg ${style?.dot ?? "bg-muted"}`}
        />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mb-2.5 flex min-w-0 flex-1 flex-wrap items-center gap-3.5 rounded-xl border border-border bg-surface p-3 text-left hover:bg-surface-2"
      >
        <GameImage
          path={art?.header}
          name={game.game.name}
          className="aspect-460/215 w-24 shrink-0 rounded-lg"
          textClassName="text-sm"
        />

        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{game.game.name}</span>
            {version.reason && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style?.badge ?? "bg-surface-3 text-muted"}`}
              >
                {reasonLabels[version.reason] ?? version.reason}
              </span>
            )}
          </div>
          <span className="text-sm text-muted">
            {version.device} · {formatSize(version.size)} · {version.fileCount}{" "}
            Dateien
          </span>
          {note && (
            <span className="flex items-center gap-1.5 text-sm">
              <StickyNote size={14} aria-hidden="true" />
              {note}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs text-muted">
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
          {pinned && (
            <Pin
              size={16}
              className="text-accent-text"
              aria-label="Angepinnt"
            />
          )}
        </div>
      </button>
    </li>
  );
};

export default HistoryRow;
