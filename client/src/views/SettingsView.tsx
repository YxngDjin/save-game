import { useEffect, useState } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { api } from "../api";
import { StorageInfo, type PairingStatus } from "../types";
import { Theme } from "../hooks/useTheme";
import SettingsSection from "../components/SettingsSection";
import SettingRow from "../components/SettingRow";
import Switch from "../components/Switch";
import ThemePicker from "../components/ThemePicker";
import { type ServerStatus } from "../hooks/useServerStatus";
import { Monitor } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { formatSize } from "../format";

interface SettingsViewProps {
  pairing: PairingStatus | null;
  onPairingChange: (status: PairingStatus) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  serverStatus: ServerStatus;
}

const inputClass =
  "h-11 rounded-lg border border-border-strong bg-surface-2 px-3 text-sm text-text outline-none focus:border-accent";
const secondaryButton =
  "h-11 rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-surface-2 disabled:opacity-50";
const primaryButton =
  "h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-50";

const SettingsView = ({
  pairing,
  onPairingChange,
  theme,
  onThemeChange,
  serverStatus,
}: SettingsViewProps) => {
  const [serverUrl, setServerUrl] = useState(pairing?.serverUrl ?? "http://");
  const [deviceName, setDeviceName] = useState("Gaming-PC");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [autostart, setAutostart] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [libraries, setLibraries] = useState<string[] | null>(null);
  const [version, setVersion] = useState("");

  useEffect(() => {
    isEnabled().then(setAutostart);
    api
      .getStorageInfo()
      .then(setStorage)
      .catch(() => {});
    api.getSteamLibraries().then(setLibraries);
    getVersion().then(setVersion);
  }, []);

  async function run(pending: string, task: () => Promise<string>) {
    setBusy(true);
    setMessage(pending);
    try {
      setMessage(await task());
    } catch (e) {
      setMessage(`Fehler: ${e}`);
    } finally {
      setBusy(false);
    }
  }
  const testServer = () =>
    run("Teste Verbindung …", async () => {
      const health = await api.testServer(serverUrl);
      return `Verbunden: ${health.games} Spiele, ${health.backups} Backups, ${health.devices} Geräte`;
    });

  const pair = () =>
    run("Kopple ...", async () => {
      onPairingChange(await api.pairDevice(serverUrl, code, deviceName));
      setCode("");
      return "Erfolgreich gekoppelt";
    });

  const unpair = () =>
    run("Entkopple ...", async () => {
      onPairingChange(await api.unpairDevice());
      return "Entkoppelt";
    });

  async function toggleAutostart(enabled: boolean) {
    if (enabled) {
      await enable();
    } else {
      await disable();
    }
    setAutostart(await isEnabled());
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>

      <SettingsSection title="Erscheinungsbild">
        <ThemePicker value={theme} onChange={onThemeChange} />
      </SettingsSection>

      <SettingsSection
        title="Server"
        description="Dein Raspberry Pi oder NAS, auf dem die Backups liegen."
      >
        {pairing?.paired ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-muted">
              <Monitor size={20} aria-hidden="true" />
            </div>
            <div className="flex min-2-0 flex-1 flex-col">
              <span className="font-semibold">{pairing.deviceName}</span>
              <span className="truncate text-sm text-muted">
                Gekoppelt mit {pairing.serverUrl}
              </span>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                serverStatus === "online"
                  ? "bg-accent/15 text-accent-text"
                  : serverStatus === "offline"
                    ? "bg-danger/10 text-danger"
                    : "bg-surface-3 text-muted"
              }`}
            >
              {serverStatus === "online"
                ? "Erreichbar"
                : serverStatus === "offline"
                  ? "Nicht erreichbar"
                  : "Prüfe"}
            </span>
            <button
              type="button"
              onClick={unpair}
              disabled={busy}
              className={`${secondaryButton} text-danger`}
            >
              Entkoppeln
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex min-w-60 flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium">Serveradresse</span>
                <input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.currentTarget.value)}
                  placeholder="http://192.168.178.25:3100"
                  className={`${inputClass} font-mono`}
                />
              </label>
              <button
                type="button"
                onClick={testServer}
                disabled={busy}
                className={secondaryButton}
              >
                Verbindung testen
              </button>
            </div>

            <div className="flex flex-col gap-0.5 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Gerät koppeln</h3>
              <p className="text-sm text-muted">
                Erstelle in der Weboberfläche unter „Geräte" einen Kopplungscode
                und gib ihn hier ein.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="flex min-w-48 flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium">Gerätename</span>
                <input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.currentTarget.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex w-40 flex-col gap-1.5">
                <span className="text-sm font-medium">Kopplungscode</span>
                <input
                  value={code}
                  onChange={(e) =>
                    setCode(e.currentTarget.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className={`${inputClass} font-mono tracking-[0.3em]`}
                />
              </label>
              <button
                type="button"
                onClick={pair}
                disabled={busy || code.length !== 6}
                className={primaryButton}
              >
                Koppeln
              </button>
            </div>
          </>
        )}

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              message.startsWith("Fehler")
                ? "bg-danger/10 text-danger"
                : "bg-surface-2 text-muted"
            }`}
          >
            {message}
          </p>
        )}
      </SettingsSection>

      <SettingsSection title="Automatik">
        <SettingRow
          title="Mit Windows starten"
          description="Startet unsichtbar im Infobereich"
        >
          <Switch
            checked={autostart}
            onChange={toggleAutostart}
            label="Mit Windows starten"
          />
        </SettingRow>
        <SettingRow
          title="Nach Spielende sichern"
          description="Erkennt, wenn ein Steam-Spiel beendet wird"
          badge="Bald verfügbar"
        >
          <Switch
            checked
            onChange={() => {}}
            label="Nach Spielende sichern"
            disabled
          />
        </SettingRow>
        <SettingRow
          title="Zwischenstände während des Spielens"
          description="Alle 30 Minuten sichern, falls sich etwas geändert hat"
          badge="Bald"
        >
          <Switch
            checked={false}
            onChange={() => {}}
            label="Zwischenstände"
            disabled
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Launcher"
        description="Von welchen Launcher Spiele erkannt werden."
      >
        <SettingRow
          title="Steam"
          badge={
            libraries && libraries.length === 0 ? "Nicht gefunden" : undefined
          }
        >
          <span className="text-sm text-muted">
            {libraries === null
              ? "Suche …"
              : `${libraries.length} ${libraries.length === 1 ? "Bibliothek" : "Bibliotheken"}`}
          </span>
        </SettingRow>
        {libraries && libraries.length > 0 && (
          <ul className="-mt-2 flex flex-col gap-1">
            {libraries.map((path) => (
              <li key={path} className="font-mono text-xs text-muted">
                {path}
              </li>
            ))}
          </ul>
        )}
        <SettingRow title="Epic Games" badge="Bald">
          <Switch
            checked={false}
            onChange={() => {}}
            label="Epic Games"
            disabled
          />
        </SettingRow>
        <SettingRow title="GOG Galaxy" badge="Bald">
          <Switch
            checked={false}
            onChange={() => {}}
            label="GOG Galaxy"
            disabled
          />
        </SettingRow>
        <SettingRow title="EA App" badge="Bald">
          <Switch checked={false} onChange={() => {}} label="EA App" disabled />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Lokaler Speicher"
        description="Hier legt SaveGame die Backups auf diesem PC ab."
      >
        <div className="flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-2 px-3 py-2.5 font-mono text-xs">
            {storage?.path ?? "…"}
          </code>
          <button
            type="button"
            onClick={() => storage && revealItemInDir(storage.path)}
            disabled={!storage}
            className={secondaryButton}
          >
            Ordner öffnen
          </button>
        </div>
        {storage && (
          <p className="text-sm text-muted">
            {storage.backupCount} Backups · {formatSize(storage.totalBytes)}{" "}
            belegt
          </p>
        )}
        <SettingRow
          title="Lokale Versionen pro Spiel"
          description="Ältere werden automatisch gelöscht"
          badge="Bald"
        >
          <input
            type="number"
            value={5}
            disabled
            readOnly
            className={`${inputClass} w-20 opacity-50`}
          />
        </SettingRow>
      </SettingsSection>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-muted">
        <span>SaveGame {version}</span>
        <span>Spielstand-Daten: Ludusavi-Manifest</span>
      </footer>
    </div>
  );
};

export default SettingsView;
