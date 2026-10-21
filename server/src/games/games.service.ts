import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { toResponse } from '../backups/backup.mapper.js';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const games = await this.prisma.game.findMany({
      orderBy: { displayName: 'asc' },
      include: {
        _count: { select: { backups: true } },
        backups: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return games.map(({ backups, _count, ...game }) => ({
      ...game,
      backupCount: _count.backups,
      latestBackup: backups[0] ? toResponse(backups[0]) : null,
    }));
  }

  async findBackups(gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('Spiel nicht gefunden');
    }

    const backups = await this.prisma.backup.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      include: {
        device: { select: { name: true } },
      },
    });

    return backups.map(({ device, ...backup }) => ({
      ...toResponse(backup),
      deviceName: device.name,
    }));
  }
}
