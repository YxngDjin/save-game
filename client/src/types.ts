export interface ServerBackup {
  id: string;
  createdAt: string;
  fileCount: number;
  sizeBytes: number;
  reason: string;
  deviceName: string;
  contentHash: string;
}

export interface PairingStatus {
  serverUrl: string | null;
  deviceName: string | null;
  paired: boolean;
}

export interface SaveLocation {
  rawPath: string;
  tags: string[];
  resolved: string | null;
  found: string[];
}

export interface Health {
  status: string;
  devices: number;
  games: number;
  backups: number;
}

export interface BackupFile {
  path: string;
  portable: string;
  size: number;
}

export interface ScannedGame {
  game: Game;
  manifestName: string;
  locations: SaveLocation[];
  files: BackupFile[];
  totalSize: number;
}

export interface BackupSummary {
  fileName: string;
  createdAt: string;
  fileCount: number;
  totalSize: number;
  contentHash: string;
}

export interface AutoBackupEvent {
  launcherId: string;
  message: string;
}

export interface Game {
  name: string;
  launcher: string;
  launcherId: string;
  installDir: string;
}

export interface GameArt {
  header: string | null;
  capsule: string | null;
  hero: string | null;
  logo: string | null;
}
