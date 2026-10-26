import { RotateCcw } from "lucide-react";
import { formatDate, formatSize, reasonLabels } from "../format";
import type { Version } from "../versions";

interface VersionDetailProps {
  version: Version;
  note: string;
  pinned: boolean;
  busy: boolean;
  onNoteChange: (note: string) => void;
  onTogglePin: () => void;
  onRestore: () => void;
}

const exampleDiff = [
  { sign: "~", path: "SaveGames/…/Hauptwelt.sav", tone: "bg-info/15 text-info" },
  { sign: "+", path: "SaveGames/…/autosave_2.sav", tone: "bg-accent/15 text-accent-text" },
  { sign: "−", path: "SaveGames/…/Testwelt.sav", tone: "bg-danger/15 text-danger" },
];

const shortHash = (hash: string) =>
  hash.length > 12 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash;

const VersionDetail = ({
  version,
  note,
  pinned,
  busy,
  onNoteChange,
  onTogglePin,
  onRestore,
}: VersionDetailProps) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">
          Version
        </span>
        <h2 className="font-display text-xl font-bold">
          {formatDate(version.createdAt)}
        </h2>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Gerät</dt>
          <dd className="font-medium">{version.device}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Auslöser</dt>
          <dd className="font-medium">
            {version.reason ? (reasonLabels[version.reason] ?? version.reason) : "–"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Größe</dt>
          <dd className="font-medium">
            {formatSize(version.size)} · {version.fileCount} Dateien
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Prüfsumme</dt>
          <dd className="font-mono text-xs" title={version.hash}>
            {shortHash(version.hash)}
          </dd>
        </div>
      </dl>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Notiz</span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => onNoteChange(e.currentTarget.value)}
          placeholder="z. B. „Vor dem Endboss“"
          className="resize-y rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3">
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold">Anpinnen</span>
          <span className="text-xs text-muted">
            Wird nie automatisch aufgeräumt
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={pinned}
          aria-label="Anpinnen"
          onClick={onTogglePin}
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
            pinned ? "border-accent bg-accent" : "border-border-strong bg-surface-3"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full transition-transform ${
              pinned ? "translate-x-5 bg-on-accent" : "bg-muted"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">
          Änderungen zur Vorversion{" "}
          <span className="font-normal text-muted">(Beispiel)</span>
        </span>
        <ul className="flex flex-col overflow-hidden rounded-lg border border-border">
          {exampleDiff.map((file) => (
            <li
              key={file.path}
              className="flex items-center gap-2.5 border-b border-border px-3 py-2 last:border-0"
            >
              <span
                className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${file.tone}`}
              >
                {file.sign}
              </span>
              <span className="truncate font-mono text-xs">{file.path}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onRestore}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
      >
        <RotateCcw size={18} aria-hidden="true" />
        Wiederherstellen
      </button>
    </div>
  );
};

export default VersionDetail;