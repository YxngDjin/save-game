import { invoke } from "@tauri-apps/api/core";
import type {
  BackupSummary,
  Health,
  PairingStatus,
  ScannedGame,
  ServerBackup,
} from "./types";

export const api = {
  scanGames: () => invoke<ScannedGame[]>("scan_games"),
  backupGame: (launcherId: string) => invoke<string>("backup_game", { launcherId }),
  listBackups: (launcherId: string) => invoke<BackupSummary[]>("list_backups", { launcherId }),
  restoreBackup: (launcherId: string, fileName: string) =>
    invoke<string>("restore_backup", { launcherId, fileName }),
  listServerBackups: (manifestName: string) =>
    invoke<ServerBackup[]>("list_server_backups", { manifestName }),
  restoreServerBackup: (launcherId: string, backupId: string) =>
    invoke<string>("restore_server_backup", { launcherId, backupId }),
  testServer: (url: string) => invoke<Health>("test_server", { url }),
  getPairingStatus: () => invoke<PairingStatus>("get_pairing_status"),
  pairDevice: (url: string, code: string, deviceName: string) =>
    invoke<PairingStatus>("pair_device", { url, code, deviceName }),
  unpairDevice: () => invoke<PairingStatus>("unpair_device"),
};