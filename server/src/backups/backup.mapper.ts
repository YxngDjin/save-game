import { Backup } from '../generated/prisma/client.js';

export function toResponse(backup: Backup) {
  const { storagePath: _storagePath, sizeBytes, ...rest } = backup;
  return { ...rest, sizeBytes: Number(sizeBytes) };
}
