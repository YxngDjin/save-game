import { useEffect, useState } from "react";
import type { RunningGame } from "../types";
import { api } from "../api";
import { listen } from "@tauri-apps/api/event";

export const useRunningGame = () => {
  const [running, setRunning] = useState<RunningGame | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getRunningGame().then((game) => {
      if (!cancelled) setRunning(game);
    });

    const unlisten = listen<RunningGame | null>("running-game", (event) => {
      setRunning(event.payload);
    });

    return () => {
      cancelled = true;
      unlisten.then((stop) => stop());
    };
  }, []);

  return running;
};
