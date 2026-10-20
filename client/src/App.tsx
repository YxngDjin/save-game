import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface Game {
  name: string;
  launcher: string;
  launcherId: string;
  installDir: string;
}

interface SaveLocation {
  rawPath: string;
  tags: string[];
  resolved: string | null;
  found: string[];
}

interface ScannedGame {
  game: Game;
  manifestName: string;
  locations: SaveLocation[];
}

function App() {
  const [scanned, setScanned] = useState<ScannedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  }, []);

  return (
    <main className="container" style={{ textAlign: "left" }}>
      <h1>Debug: Spiele mit Spielständen ({scanned.length})</h1>

      <button onClick={scan} disabled={loading}>
        {loading ? "Scanne …" : "Neu scannen"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {scanned.map((entry) => (
          <li key={entry.game.launcherId} style={{ marginBottom: "1rem" }}>
            <strong>{entry.game.name}</strong> ({entry.game.launcher}, ID {entry.game.launcherId})
            <br />
            <small>Manifest: {entry.manifestName}</small>
            <br />
            <small>Installiert: {entry.game.installDir}</small>
            <ul>
              {entry.locations.map((location) => (
                <li key={location.rawPath}>
                  <code>{location.rawPath}</code>
                  {location.tags.length > 0 && <> [{location.tags.join(", ")}]</>}
                  <br />
                  <small>→ {location.resolved ?? "nicht auflösbar"}</small>
                  <br />
                  <small style={{ color: location.found.length > 0 ? "green" : "gray" }}>
                    {location.found.length} Treffer
                  </small>
                  {location.found.length > 0 && (
                    <ul>
                      {location.found.map((foundPath) => (
                        <li key={foundPath}>
                          <small>{foundPath}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;