import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { formatDate } from "../format";
import type { Version } from "../versions";

interface RestoreDialogProps {
  version: Version;
  gameName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const RestoreDialog = ({
  version,
  gameName,
  onCancel,
  onConfirm,
}: RestoreDialogProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-title"
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border-strong bg-surface p-6"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warn/15 text-warn">
          <RotateCcw size={22} aria-hidden="true" />
        </div>
        <h2 id="restore-title" className="font-display text-xl font-bold">
          Version vom {formatDate(version.createdAt)} wiederherstellen?
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
          <li>
            Dein aktueller Stand von {gameName} wird vorher automatisch
            gesichert.
          </li>
          <li>Schließe das Spiel, bevor du fortfährst.</li>
          {!version.local && (
            <li>Die Version wird zuerst vom Server heruntergeladen.</li>
          )}
        </ul>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:opacity-90"
          >
            Wiederherstellen
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreDialog;
