export interface AdminBackup {
  id: string;
  createdAt: string;
  uploadedAt: string;
  fileCount: number;
  sizeBytes: number;
  reason: string;
  launcher: string;
  launcherId: string;
  deviceName?: string;
}

export interface AdminGame {
  id: string;
  manifestName: string;
  displayName: string;
  backupCount: number;
  latestBackup: AdminBackup | null;
}

export interface AdminDevice {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  backupCount: number;
}

export interface PairingCode {
  code: string;
  expiresAt: string;
}
