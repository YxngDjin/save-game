import { useState } from "react";

interface BackupMeta {
  note?: string;
  pinned?: boolean;
}

type MetaStore = Record<string, BackupMeta>;

const STORAGE_KEY = "backupMeta";

const load = (): MetaStore => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
};

export const useBackupMeta = () => {
  const [store, setStore] = useState<MetaStore>(load);

  const update = (hash: string, change: BackupMeta) => {
    setStore((prev) => {
      const next = { ...prev, [hash]: { ...prev[hash], ...change } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return {
    getNote: (hash: string) => store[hash]?.note ?? "",
    isPinned: (hash: string) => store[hash]?.pinned ?? false,
    setNote: (hash: string, note: string) => update(hash, { note }),
    togglePin: (hash: string) => update(hash, { pinned: !store[hash]?.pinned }),
  };
};
