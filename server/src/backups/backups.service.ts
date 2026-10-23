import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBackupDto } from './dto/create-backup.dto.js';
import { toResponse } from './backup.mapper.js';
import { createReadStream } from 'node:fs';
import { Logger } from '@nestjs/common';

@Injectable()
export class BackupsService {
  private readonly dataDir: string;
  private readonly logger = new Logger(BackupsService.name);
  private readonly retentionCount: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.dataDir = path.resolve(config.getOrThrow<string>('DATA_DIR'));

    const retention = Number(config.get<string>('RETENTION_COUNT') ?? 10);
    if (!Number.isInteger(retention) || retention < 0) {
      throw new Error('RETENTION_COUNT muss eine ganze Zahl ab 0 sein');
    }
    this.retentionCount = retention;
  }

  private async prune(gameId: string) {
    if (this.retentionCount === 0) {
      return;
    }

    const outdated = await this.prisma.backup.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      skip: this.retentionCount,
      select: { id: true, storagePath: true },
    });
    if (outdated.length === 0) {
      return;
    }

    await this.prisma.backup.deleteMany({
      where: { id: { in: outdated.map((backup) => backup.id) } },
    });
    (await Promise.all(
      outdated.map((backup) =>
        fs.rm(path.join(this.dataDir, backup.storagePath), { force: true }),
      ),
    ),
      this.logger.log(
        `${outdated.length} alte Backups für Spiel ${gameId} gelöscht`,
      ));
  }

  async create(
    dto: CreateBackupDto,
    file: Express.Multer.File,
    deviceId: string,
  ) {
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
            deviceId: deviceId,
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

        await this.prune(game.id).catch((error) =>
          this.logger.warn(`Aufräumen fehlgeschlagen: ${error}`),
        );

        return { duplicate: false, backup: toResponse(backup) };
      } catch (error) {
        await fs.rm(target, { force: true });
        throw error;
      }
    } finally {
      await fs.rm(file.path, { force: true });
    }
  }

  async getFile(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });
    if (!backup) {
      throw new NotFoundException('Backup nicht gefunden');
    }

    const fullPath = path.join(this.dataDir, backup.storagePath);
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat) {
      throw new NotFoundException('Backup-Datei fehlt auf dem Server');
    }

    return { backup, size: stat.size, stream: createReadStream(fullPath) };
  }
}
