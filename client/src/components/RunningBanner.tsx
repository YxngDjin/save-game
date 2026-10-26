import { CloudUpload } from "lucide-react";
import GameImage from "./GameImage";
import { useGameArt } from "../hooks/useGameArt";
import { formatTime } from "../format";
import type { RunningGame } from "../types";

interface RunningBannerProps {
  game: RunningGame;
  known: boolean;
  busy: boolean;
  onBackup: () => void;
  onOpen: () => void;
}

const RunningBanner = ({
  game,
  known,
  busy,
  onBackup,
  onOpen,
}: RunningBannerProps) => {
  const art = useGameArt(game.launcherId, "steam");

  return (
    <section
      aria-label="Läuft gerade"
      className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4"
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={!known}
        className="shrink-0"
      >
        <GameImage
          path={art?.header}
          name={game.name}
          className="aspect-460/215 w-32 rounded-lg"
          textClassName="text-lg"
        />
      </button>

      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-accent-text uppercase">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          Läuft gerade
        </span>
        <span className="truncate text-base font-semibold">
          {game.name} · seit {formatTime(game.since)}
        </span>
        <span className="text-sm text-muted">
          {known
            ? "Wird nach dem Beenden automatisch gesichert und hochgeladen."
            : "Für dieses Spiel ist kein Speicherort bekannt. Es wird nicht gesichert."}
        </span>
      </div>

      {known && (
        <button
          type="button"
          onClick={onBackup}
          disabled={busy}
          className="flex h-10 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          <CloudUpload size={16} aria-hidden="true" />
          Zwischenstand sichern
        </button>
      )}
    </section>
  );
};

export default RunningBanner;
