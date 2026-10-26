import { useEffect, useState } from "react";
import { api } from "../api";
import { mergeVersions, type Version } from "../versions";
import type { ScannedGame, ServerBackup } from "../types";

export interface HistoryEntry {
  game: ScannedGame;
  version: Version;
}

export const useHistory = (games: ScannedGame[], paired: boolean) => {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const withSaves = games.filter((game) => game.files.length > 0);

    const load = async () => {
      const server = paired
        ? await api
            .listAllServerBackups(withSaves.map((game) => game.manifestName))
            .catch(() => ({}) as Record<string, ServerBackup[]>)
        : {};

      const lists = await Promise.all(
        withSaves.map(async (game) => {
          const local = await api
            .listBackups(game.game.launcherId)
            .catch(() => []);
          const remote = server[game.manifestName] ?? [];
          return mergeVersions(local, remote).map((version) => ({
            game,
            version,
          }));
        }),
      );

      if (cancelled) return;
      const all = lists.flat();
      all.sort(
        (a, b) =>
          new Date(b.version.createdAt).getTime() -
          new Date(a.version.createdAt).getTime(),
      );
      setEntries(all);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [games, paired]);

  return entries;
};
