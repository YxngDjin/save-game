import { useEffect, useState } from "react";
import { api, errorMessage } from "./api";
import { formatDate } from "./format";
import type { AdminDevice, PairingCode } from "./types";

function secondsLeft(expiresAt: string): number {
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}

function PairingCodeBox({
  pairing,
  onClose,
}: {
  pairing: PairingCode;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(
      () => setRemaining(secondsLeft(pairing.expiresAt)),
      250,
    );
    return () => clearInterval(timer);
  }, [pairing.expiresAt]);

  const expired = remaining === 0;
  const minutes = Math.floor((remaining ?? 0) / 60);
  const seconds = String((remaining ?? 0) % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-white p-6">
      <p className="text-sm text-neutral-500">
        Gib diesen Code in der App unter „Einstellungen" ein:
      </p>
      {!expired ? (
        <>
          <p className="font-mono text-5xl font-semibold tracking-[0.3em]">
            {pairing.code}
          </p>
          <p className="text-sm text-neutral-500">
            {remaining === null ? "…" : `Gültig noch ${minutes}:${seconds}`}
          </p>
        </>
      ) : (
        <p className="text-sm text-red-600">Der Code ist abgelaufen.</p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
      >
        Fertig
      </button>
    </div>
  );
}

export function DevicesPage() {
  const [devices, setDevices] = useState<AdminDevice[] | null>(null);
  const [pairing, setPairing] = useState<PairingCode | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.devices().then(
      (list) => {
        if (!cancelled) setDevices(list);
      },
      (e) => {
        if (!cancelled) setError(errorMessage(e));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  async function createCode() {
    setError("");
    try {
      setPairing(await api.createPairingCode());
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function closeCode() {
    setPairing(null);
    reload();
  }

  async function revoke(id: string) {
    setConfirmId(null);
    try {
      await api.revokeDevice(id);
      reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Geräte</h1>
          <p className="text-sm text-neutral-500">
            PCs, die Backups auf diesen Server hochladen dürfen.
          </p>
        </div>
        {!pairing && (
          <button
            type="button"
            onClick={createCode}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Neues Gerät koppeln
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {pairing && <PairingCodeBox pairing={pairing} onClose={closeCode} />}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Gerät</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Zuletzt gesehen</th>
              <th className="px-5 py-3 font-semibold">Backups</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {devices?.map((device) => (
              <tr
                key={device.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-5 py-3">
                  <div className="font-semibold">{device.name}</div>
                  <div className="text-xs text-neutral-500">
                    Gekoppelt am {formatDate(device.createdAt)}
                  </div>
                </td>
                <td className="px-5 py-3">
                  {device.revokedAt ? (
                    <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-500">
                      Gesperrt
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      Aktiv
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-neutral-600">
                  {formatDate(device.lastSeenAt)}
                </td>
                <td className="px-5 py-3 text-neutral-600">
                  {device.backupCount}
                </td>
                <td className="px-5 py-3 text-right">
                  {!device.revokedAt &&
                    (confirmId === device.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => revoke(device.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                        >
                          Ja, sperren
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(device.id)}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
                      >
                        Sperren
                      </button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
