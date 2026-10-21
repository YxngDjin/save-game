import { Backup } from '../generated/prisma/client.js';

export function toResponse(backup: Backup) {
  return { ...backup, sizeBytes: Number(backup.sizeBytes) };
}