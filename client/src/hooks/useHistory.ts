import { useEffect, useState } from "react";
import { api } from "../api";
import { mergeVersions, type Version } from "../versions";
import type { ScannedGame } from "../types";

export interface HistoryEntry {
  game: ScannedGame;
  version: Version;
}

export const useHistory = (games: ScannedGame[], paired: boolean) => {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const withSaves = games.filter((game) => game.files.length > 0);

    Promise.all(
      withSaves.map(async (game) => {
        const [local, server] = await Promise.all([
          api.listBackups(game.game.launcherId).catch(() => []),
          paired
            ? api.listServerBackups(game.manifestName).catch(() => [])
            : Promise.resolve([]),
        ]);
        return mergeVersions(local, server).map((version) => ({
          game,
          version,
        }));
      }),
    ).then((lists) => {
      if (cancelled) return;
      const all = lists.flat();
      all.sort(
        (a, b) =>
          new Date(b.version.createdAt).getTime() -
          new Date(a.version.createdAt).getTime(),
      );
      setEntries(all);
    });

    return () => {
      cancelled = true;
    };
  }, [games, paired]);

  return entries;
};
