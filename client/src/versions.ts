import type { BackupSummary, ServerBackup } from "./types";

export interface Version {
  key: string;
  createdAt: string;
  fileCount: number;
  size: number;
  hash: string;
  device: string;
  reason: string | null;
  local?: BackupSummary;
  server?: ServerBackup;
}

export const mergeVersions = (
  local: BackupSummary[],
  server: ServerBackup[],
): Version[] => {
  const versions: Version[] = server.map((backup) => ({
    key: `server/${backup.id}`,
    createdAt: backup.createdAt,
    fileCount: backup.fileCount,
    size: backup.sizeBytes,
    hash: backup.contentHash,
    device: backup.deviceName,
    reason: backup.reason,
    server: backup,
  }));

  for (const backup of local) {
    const twin = versions.find(
      (version) => version.hash === backup.contentHash && !version.local,
    );
    if (twin) {
      twin.local = backup;
      continue;
    }
    versions.push({
      key: `local/${backup.fileName}`,
      createdAt: backup.createdAt,
      fileCount: backup.fileCount,
      size: backup.totalSize,
      hash: backup.contentHash,
      device: "Dieser PC",
      reason: null,
      local: backup,
    });
  }

  return versions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};
