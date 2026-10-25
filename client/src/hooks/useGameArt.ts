import { useEffect, useState } from "react";
import { GameArt } from "../types";
import { api } from "../api";

export const useGameArt = (launcherId: string, launcher: string) => {
  const [art, setArt] = useState<GameArt | null>(null);

  useEffect(() => {
    if (launcher.toLowerCase() !== "steam") {
      return;
    }

    let cancelled = false;
    api
      .getGameArt(launcherId)
      .then((result) => {
        if (!cancelled) {
          setArt(result);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [launcherId, launcher]);

  return art;
};
