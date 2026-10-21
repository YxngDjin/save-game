import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Backup } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBackupDto } from './dto/create-backup.dto.js';

function toResponse(backup: Backup) {
  return { ...backup, sizeBytes: Number(backup.sizeBytes) };
}

@Injectable()
export class BackupsService {
  private readonly dataDir: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.dataDir = path.resolve(config.getOrThrow<string>('DATA_DIR'));
  }

  async create(dto: CreateBackupDto, file: Express.Multer.File) {
    try {
      const game = await this.prisma.game.upsert({
        where: { manifestName: dto.manifestName },
        update: {},
        create: {
          manifestName: dto.manifestName,
          displayName: dto.displayName,
        },
      });

      const latest = await this.prisma.backup.findFirst({
        where: { gameId: game.id },
        orderBy: { createdAt: 'desc' },
      });
      if (latest?.contentHash === dto.contentHash) {
        return { duplicate: true, backup: toResponse(latest) };
      }

      const id = randomUUID();
      const storagePath = path.posix.join('backups', game.id, `${id}.zip`);
      const target = path.join(this.dataDir, storagePath);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.rename(file.path, target);

      try {
        const backup = await this.prisma.backup.create({
          data: {
            id,
            gameId: game.id,
            deviceId: dto.deviceId,
            parentId: dto.parentId ?? null,
            contentHash: dto.contentHash,
            launcher: dto.launcher,
            launcherId: dto.launcherId,
            reason: dto.reason,
            fileCount: dto.fileCount,
            sizeBytes: BigInt(dto.sizeBytes),
            storagePath,
            createdAt: new Date(dto.createdAt),
          },
        });
        return { duplicate: false, backup: toResponse(backup) };
      } catch (error) {
        await fs.rm(target, { force: true });
        throw error;
      }
    } finally {
      await fs.rm(file.path, { force: true });
    }
  }
}
