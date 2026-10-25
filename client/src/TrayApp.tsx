import { useEffect, useState } from "react";
import { useTheme } from "./hooks/useTheme";
import { PairingStatus } from "./types";
import { useServerStatus } from "./hooks/useServerStatus";
import { api } from "./api";
import { AppWindow, CloudUpload, Power, Save } from "lucide-react";
import { useRunningGame } from "./hooks/useRunningGame";
import { useGameArt } from "./hooks/useGameArt";
import { formatTime } from "./format";
import GameImage from "./components/GameImage";

const statusText = {
  online: {
    label: "Verbunden",
    className: "text-accent-text",
    dot: "bg-accent",
  },
  offline: {
    label: "Nicht erreichbar",
    className: "text-danger",
    dot: "bg-danger",
  },
  checking: { label: "Verbinde …", className: "text-muted", dot: "bg-muted" },
  unpaired: {
    label: "Nicht gekoppelt",
    className: "text-muted",
    dot: "bg-muted",
  },
};

const TrayApp = () => {
  useTheme();
  const [paring, setParing] = useState<PairingStatus | null>(null);
  const serverStatus = useServerStatus(paring);
  const status = statusText[serverStatus];
  const running = useRunningGame();
  const runningArt = useGameArt(running?.launcherId ?? "", "steam");
  const [busy, setBusy] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getPairingStatus().then(setParing);
  }, []);

  useEffect(() => {
    const load = () => api.getPausedUntil().then(setPausedUntil);
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  const backupAll = async () => {
    setBusy(true);
    setMessage("Sichere alle Spiele …");
    try {
      setMessage(await api.backupAll());
    } catch (e) {
      setMessage(`Fehler: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const togglePause = async () => {
    setPausedUntil(await api.pauseAutomatic(pausedUntil ? 0 : 60));
  };

  return (
    <div className="flex h-screen p-2 text-text">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-xl">
        <header className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-on-accent">
            <Save size={16} aria-hidden="true" />
          </div>
          <span className="flex-1 font-display text-base font-bold">
            SaveGame
          </span>
          <span
            className={`flex items-center gap-1.5 text-xs font-medium ${status.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </header>

        <main className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {running ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
              <GameImage
                path={runningArt?.header}
                name={running.name}
                className="aspect-460/215 w-24 shrink-0 rounded-lg"
                textClassName="text-sm"
              />
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-accent-text uppercase">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  Läuft gerade
                </span>
                <span className="truncate font-semibold">{running.name}</span>
                <span className="text-xs text-muted">
                  seit {formatTime(running.since)} · wird danach gesichert
                </span>
              </div>
            </div>
          ) : (
            <p className="px-1 text-sm text-muted">Gerade läuft kein Spiel.</p>
          )}

          {message && (
            <p
              className={`px-1 text-xs ${message.startsWith("Fehler") ? "text-danger" : "text-muted"}`}
            >
              {message}
            </p>
          )}
        </main>

        <footer className="flex flex-col gap-2 border-t border-border p-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={backupAll}
              disabled={busy}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
            >
              <CloudUpload size={16} aria-hidden="true" />
              {busy ? "Sichere …" : "Alle sichern"}
            </button>
            <button
              type="button"
              onClick={() => api.openMainWindow()}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border-strong text-sm font-medium hover:bg-surface-2"
            >
              <AppWindow size={16} aria-hidden="true" />
              App öffnen
            </button>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={togglePause}
              className={`rounded-md px-2 py-1.5 text-xs hover:bg-surface-2 ${pausedUntil ? "text-warn" : "text-muted"}`}
            >
              {pausedUntil
                ? `Pausiert bis ${formatTime(pausedUntil)} · Fortsetzen`
                : "Automatik 1 Std. pausieren"}
            </button>
            <button
              type="button"
              onClick={() => api.quitApp()}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-danger"
            >
              <Power size={14} aria-hidden="true" />
              Beenden
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TrayApp;
