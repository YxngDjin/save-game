import { formatSize } from "../format";
import { useGameArt } from "../hooks/useGameArt";
import type { ScannedGame } from "../types";
import GameImage from "./GameImage";

interface GameCardProps {
  entry: ScannedGame;
  status?: string;
  busy: boolean;
  saving: boolean;
  onOpen: () => void;
  onBackup: () => void;
}

const GameCard = ({
  entry,
  status,
  busy,
  saving,
  onOpen,
  onBackup,
}: GameCardProps) => {
  const { game, files, totalSize } = entry;
  const hasSaves = files.length > 0;
  const art = useGameArt(game.launcherId, game.launcher);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-col text-left hover:opacity-90"
      >
        <GameImage
          path={art?.header}
          name={game.name}
          className="aspect-460/215 w-full"
        />
        <div className="flex flex-col gap-0.5 px-4 pt-3">
          <span className="font-semibold">{game.name}</span>
          <span className="text-sm text-muted">
            {hasSaves
              ? `${files.length} Dateien · ${formatSize(totalSize)}`
              : "Keine Spielstände gefunden"}
          </span>
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-4">
        <span className="rounded-md border border-border-strong px-2 py-0.5 text-xs">
          {game.launcher}
        </span>
        {hasSaves && (
          <button
            type="button"
            onClick={onBackup}
            disabled={busy}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Sichere …" : "Sichern"}
          </button>
        )}
      </div>

      {status && (
        <p className="border-t border-border px-4 py-2 text-xs text-muted">
          {status}
        </p>
      )}
    </article>
  );
};

export default GameCard;
