import { ArrowLeft, CloudUpload, FolderOpen } from "lucide-react";
import type { ScannedGame } from "../types";
import { formatSize } from "../format";
import { useGameArt } from "../hooks/useGameArt";
import GameImage from "./GameImage";

interface GameHeaderProps {
  entry: ScannedGame;
  busy: boolean;
  onBack: () => void;
  onBackup: () => void;
  onOpenFolder: () => void;
}

const GameHeader = ({
  entry,
  busy,
  onBack,
  onBackup,
  onOpenFolder,
}: GameHeaderProps) => {
  const { game, files, totalSize } = entry;
  const art = useGameArt(game.launcherId, game.launcher);

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-sm text-muted hover:text-text"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Alle Spiele
      </button>

      <GameImage
        path={art?.hero}
        name={game.name}
        className="h-52 w-full rounded-2xl"
      />

      <div className="flex flex-wrap items-end gap-4 px-4">
        <GameImage
          path={art?.capsule}
          name={game.name}
          className="-mt-20 aspect-600/900 w-28 shrink-0 rounded-xl border-4 border-bg"
          textClassName="text-2xl"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="font-display text-3xl font-bold">{game.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-md border border-border-strong px-2 py-0.5 text-xs text-text">
              {game.launcher}
            </span>
            <span>App-ID {game.launcherId}</span>
            <span aria-hidden="true">·</span>
            <span>{files.length} Dateien</span>
            <span aria-hidden="true">·</span>
            <span>{formatSize(totalSize)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenFolder}
            disabled={files.length === 0}
            className="flex items-center gap-2 rounded-lg disabled:opacity-50 border border-border-strong bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
          >
            <FolderOpen size={18} aria-hidden="true" />
            Ordner öffnen
          </button>
          <button
            type="button"
            onClick={onBackup}
            disabled={busy || files.length === 0}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
          >
            <CloudUpload size={18} aria-hidden="true" />
            Jetzt sichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
