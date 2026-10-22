import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface Game {
  name: string;
  launcher: string;
  launcherId: string;
  installDir: string;
}

interface PairingStatus {
  serverUrl: string | null;
  deviceName: string | null;
  paired: boolean;
}

interface SaveLocation {
  rawPath: string;
  tags: string[];
  resolved: string | null;
  found: string[];
}

interface Health {
  status: string;
  devices: number;
  games: number;
  backups: number;
}

interface BackupFile {
  path: string;
  portable: string;
  size: number;
}

interface ScannedGame {
  game: Game;
  manifestName: string;
  locations: SaveLocation[];
  files: BackupFile[];
  totalSize: number;
}

interface BackupSummary {
  fileName: string;
  createdAt: string;
  fileCount: number;
  totalSize: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE");
}

function App() {
  const [scanned, setScanned] = useState<ScannedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<Record<string, string>>({});
  const [backups, setBackups] = useState<Record<string, BackupSummary[]>>({});
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [serverStatus, setServerStatus] = useState("");
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [deviceName, setDeviceName] = useState("Gaming-PC");
  const [pairCode, setPairCode] = useState("");

  function setStatus(launcherId: string, text: string) {
    setBackupStatus((prev) => ({ ...prev, [launcherId]: text }));
  }

  async function testServer() {
    setServerStatus("Teste Verbindung …");
    try {
      const health = await invoke<Health>("test_server", { url: serverUrl });
      setServerStatus(
        `Verbunden: ${health.games} Spiele, ${health.backups} Backups, ${health.devices} Geräte`,
      );
    } catch (e) {
      setServerStatus(`Fehler: ${e}`);
    }
  }

  async function pair() {
    setServerStatus("Kopple …");
    try {
      setPairing(
        await invoke<PairingStatus>("pair_device", {
          url: serverUrl,
          code: pairCode,
          deviceName,
        }),
      );
      setPairCode("");
      setServerStatus("Erfolgreich gekoppelt");
    } catch (e) {
      setServerStatus(`Fehler: ${e}`);
    }
  }

  async function unpair() {
    try {
      setPairing(await invoke<PairingStatus>("unpair_device"));
      setServerStatus("Entkoppelt");
    } catch (e) {
      setServerStatus(`Fehler: ${e}`);
    }
  }

  async function restore(launcherId: string, fileName: string) {
    setConfirmKey(null);
    setBusyId(launcherId);
    setStatus(launcherId, "Stelle wieder her …");
    try {
      const message = await invoke<string>("restore_backup", {
        launcherId,
        fileName,
      });
      setStatus(launcherId, message);
      await loadBackups(launcherId);
    } catch (e) {
      setStatus(launcherId, `Fehler: ${e}`);
    } finally {
      setBusyId(null);
    }
  }

  async function loadBackups(launcherId: string) {
    try {
      const list = await invoke<BackupSummary[]>("list_backups", {
        launcherId,
      });
      setBackups((prev) => ({ ...prev, [launcherId]: list }));
    } catch (e) {
      setStatus(launcherId, `Fehler beim Laden der Backups: ${e}`);
    }
  }

  async function backup(launcherId: string) {
    setBusyId(launcherId);
    setStatus(launcherId, "Sichere …");
    try {
      const path = await invoke<string>("backup_game", { launcherId });
      setStatus(launcherId, `Gesichert: ${path}`);
      await loadBackups(launcherId);
    } catch (e) {
      setStatus(launcherId, `Fehler: ${e}`);
    } finally {
      setBusyId(null);
    }
  }

  async function scan() {
    setLoading(true);
    setError("");
    try {
      setScanned(await invoke<ScannedGame[]>("scan_games"));
    } catch (e) {
      setError(`${e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    scan();
    invoke<PairingStatus>("get_pairing_status").then(setPairing);
  }, []);

  const withFiles = scanned.filter((entry) => entry.files.length > 0).length;

  return (
    <main className="container" style={{ textAlign: "left" }}>
      <h1>Debug: Spiele mit Spielständen ({scanned.length})</h1>
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Server</h2>
        {pairing?.paired ? (
          <p>
            Gekoppelt als <strong>{pairing.deviceName}</strong> mit{" "}
            {pairing.serverUrl} <button onClick={unpair}>Entkoppeln</button>
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              maxWidth: "24rem",
            }}
          >
            <label>
              Serveradresse
              <input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.currentTarget.value)}
              />
            </label>
            <button onClick={testServer}>Verbindung testen</button>
            <label>
              Gerätename
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.currentTarget.value)}
              />
            </label>
            <label>
              Kopplungscode
              <input
                value={pairCode}
                onChange={(e) => setPairCode(e.currentTarget.value)}
                placeholder="000000"
                maxLength={6}
              />
            </label>
            <button onClick={pair} disabled={pairCode.length !== 6}>
              Koppeln
            </button>
          </div>
        )}
        {serverStatus && <p>{serverStatus}</p>}
      </section>
      <p>Davon mit gefundenen Dateien: {withFiles}</p>

      <button onClick={scan} disabled={loading}>
        {loading ? "Scanne …" : "Neu scannen"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {scanned.map((entry) => {
          const id = entry.game.launcherId;
          const gameBackups = backups[id];

          return (
            <li key={id} style={{ marginBottom: "1rem" }}>
              <strong>{entry.game.name}</strong> ({entry.game.launcher}, ID {id}
              )
              <br />
              <small>Manifest: {entry.manifestName}</small>
              <br />
              <small>Installiert: {entry.game.installDir}</small>
              <br />
              <small
                style={{ color: entry.files.length > 0 ? "green" : "gray" }}
              >
                {entry.files.length} Dateien, {formatSize(entry.totalSize)}
              </small>
              {entry.files.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  <button onClick={() => backup(id)} disabled={busyId !== null}>
                    {busyId === id ? "Sichere …" : "Jetzt sichern"}
                  </button>
                  {backupStatus[id] && (
                    <div>
                      <small>{backupStatus[id]}</small>
                    </div>
                  )}
                </div>
              )}
              {entry.files.length > 0 && (
                <details>
                  <summary>Dateien anzeigen</summary>
                  <ul>
                    {entry.files.map((file) => (
                      <li key={file.path}>
                        <small>
                          <code>{file.portable}</code> ({formatSize(file.size)})
                        </small>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <details
                onToggle={(e) => {
                  if (e.currentTarget.open && !gameBackups) loadBackups(id);
                }}
              >
                <summary>
                  Backups{gameBackups ? ` (${gameBackups.length})` : ""}
                </summary>
                {!gameBackups && <small>Lade …</small>}
                {gameBackups && gameBackups.length === 0 && (
                  <small>Noch keine Backups vorhanden.</small>
                )}
                {gameBackups && gameBackups.length > 0 && (
                  <ul>
                    {gameBackups.map((b) => (
                      <li key={b.fileName}>
                        <small>
                          {formatDate(b.createdAt)} – {b.fileCount} Dateien,{" "}
                          {formatSize(b.totalSize)}
                        </small>{" "}
                        {confirmKey === `${id}/${b.fileName}` ? (
                          <>
                            <button
                              onClick={() => restore(id, b.fileName)}
                              disabled={busyId !== null}
                            >
                              Ja, überschreiben
                            </button>{" "}
                            <button onClick={() => setConfirmKey(null)}>
                              Abbrechen
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmKey(`${id}/${b.fileName}`)}
                            disabled={busyId !== null}
                          >
                            Wiederherstellen
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default App;
