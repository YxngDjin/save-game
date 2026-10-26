import { useEffect, useState } from "react";
import { api } from "../api";
import type { PairingStatus } from "../types";

export type ServerStatus = "unpaired" | "checking" | "online" | "offline";

export const useServerStatus = (
  pairing: PairingStatus | null,
  intervalMs = 30_000,
) => {
  const [status, setStatus] = useState<ServerStatus>("checking");
  const url = pairing?.paired ? pairing.serverUrl : null;

  useEffect(() => {
    if (!url) {
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        await api.testServer(url);
        if (!cancelled) setStatus("online");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };

    check();
    const timer = setInterval(check, intervalMs);
    window.addEventListener("focus", check);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [url, intervalMs]);

  return url ? status : "unpaired";
};
