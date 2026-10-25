import { useEffect, useState } from "react";
import "./App.css";
import { api } from "./api";
import { Sidebar, type View } from "./components/Sidebar";
import type { PairingStatus, ScannedGame, AutoBackupEvent } from "./types";
import { listen } from "@tauri-apps/api/event";
import GamesView from "./views/GamesView";
import GameView from "./views/GameView";
import SettingsView from "./views/SettingsView";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import { useServerStatus } from "./hooks/useServerStatus";

function App() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>({ name: "games" });
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [games, setGames] = useState<ScannedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatusMap] = useState<Record<string, string>>({});
  const { isDark, setTheme, theme } = useTheme();
  const serverStatus = useServerStatus(pairing);

  const setStatus = (launcherId: string, text: string) => {
    setStatusMap((prev) => ({ ...prev, [launcherId]: text }));
  };

  async function scan() {
    setLoading(true);
    setError("");
    try {
      setGames(await api.scanGames());
    } catch (e) {
      setError(`${e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    scan();
    api.getPairingStatus().then(setPairing);
  }, []);

  useEffect(() => {
    const unlisten = listen<AutoBackupEvent>("auto-backup", (event) => {
      setStatus(
        event.payload.launcherId,
        `Automatisch: ${event.payload.message}`,
      );
    });

    return () => {
      unlisten.then((stop) => stop());
    };
  }, []);

  async function runTask(
    launcherId: string,
    pending: string,
    task: () => Promise<string>,
  ) {
    setBusyId(launcherId);
    setStatus(launcherId, pending);
    try {
      setStatus(launcherId, await task());
    } catch (e) {
      setStatus(launcherId, `Fehler: ${e}`);
    } finally {
      setBusyId(null);
    }
  }

  const backup = (launcherId: string) =>
    runTask(launcherId, "Sichere ...", () => api.backupGame(launcherId));

  return (
    <div className="flex flex-col h-screen bg-bg text-text">
      <Navbar
        search={search}
        onSearchChange={setSearch}
        isDark={isDark}
        onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
        pairing={pairing}
        serverStatus={serverStatus}
      />
      <div className="flex bg-surface flex-1 min-h-0 text-text">
        <Sidebar view={view} onNavigate={setView} />

        <main className="flex-1 overflow-y-auto p-8">
          {view.name === "games" && (
            <GamesView
              search={search}
              games={games}
              loading={loading}
              error={error}
              busyId={busyId}
              status={status}
              onRescan={scan}
              onBackup={backup}
              onOpen={(launcherId) => setView({ name: "game", launcherId })}
            />
          )}
          {view.name === "game" &&
            (() => {
              const entry = games.find(
                (g) => g.game.launcherId === view.launcherId,
              );
              if (!entry) {
                return (
                  <p className="text-sm text-muted">Spiel nicht gefunden.</p>
                );
              }
              return (
                <GameView
                  key={entry.game.launcherId}
                  entry={entry}
                  paired={pairing?.paired ?? false}
                  busy={busyId !== null}
                  status={status[entry.game.launcherId]}
                  onBack={() => setView({ name: "games" })}
                  onTask={(pending, task) =>
                    runTask(entry.game.launcherId, pending, task)
                  }
                />
              );
            })()}
          {view.name === "settings" && (
            <SettingsView
              pairing={pairing}
              onPairingChange={setPairing}
              theme={theme}
              onThemeChange={setTheme}
              serverStatus={serverStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
export default App;
