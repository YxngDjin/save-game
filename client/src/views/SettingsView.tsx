import { useEffect, useState } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { api } from "../api";
import type { PairingStatus } from "../types";

interface SettingsViewProps {
  pairing: PairingStatus | null;
  onPairingChange: (status: PairingStatus) => void;
}

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900";
const secondaryButton =
  "rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50";
const primaryButton =
  "rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50";

const SettingsView = ({ pairing, onPairingChange }: SettingsViewProps) => {
  const [serverUrl, setServerUrl] = useState(pairing?.serverUrl ?? "http://");
  const [deviceName, setDeviceName] = useState("Gaming-PC");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    isEnabled().then(setAutostart);
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
    if (enable) {
      await enable();
    } else {
      await disable();
    }
    setAutostart(await isEnabled());
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>

      <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5">
        <div>
          <h2 className="font-semibold">Server</h2>
          <p className="text-sm text-neutral-500">
            Dein Raspberry Pi oder NAS, auf dem die Spielstände gespeichert
            werden.
          </p>
        </div>

        {pairing?.paired ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Gekoppelt als <strong>{pairing.deviceName}</strong> mit{" "}
              {pairing.serverUrl}
            </p>
            <button
              type="button"
              onClick={unpair}
              disabled={busy}
              className={secondaryButton}
            >
              Entkoppeln
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
                Serveradresse
                <input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.currentTarget.value)}
                  placeholder="http://raspberrypi.local:3100"
                  className={inputClass}
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

            <div className="border-t border-neutral-100 pt-4">
              <h3 className="text-sm font-semibold">Gerät koppeln</h3>
              <p className="text-sm text-neutral-500">
                Fordere am Server einen Kopplungscode an und gib ihn hier ein.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
                Gerätename
                <input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.currentTarget.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex w-36 flex-col gap-1 text-xs text-neutral-500">
                Kopplungscode
                <input
                  value={code}
                  onChange={(e) =>
                    setCode(e.currentTarget.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className={`${inputClass} tracking-widest`}
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

        {message && <p className="text-sm text-neutral-700">{message}</p>}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">Automatik</h2>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={autostart}
            onChange={(e) => toggleAutostart(e.currentTarget.checked)}
          />
          Mit Windows starten (im Infobereich)
        </label>
        <p className="text-sm text-neutral-500">
          Nach dem Beenden eines Steam-Spiels wird automatisch gesichert und,
          wenn gekoppelt, auf den Server hochgeladen.
        </p>
      </section>
    </div>
  );
};

export default SettingsView;
