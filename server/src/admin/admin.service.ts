import { Injectable, NotFoundException } from '@nestjs/common';
import { generateToken, hashToken } from '../auth/token.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listDevices() {
    const devices = await this.prisma.device.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastSeenAt: true,
        revokedAt: true,
        _count: { select: { backups: true } },
      },
    });
    return devices.map(({ _count, ...devices }) => ({
      ...devices,
      backupCount: _count.backups,
    }));
  }

  async revokeDevice(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) {
      throw new NotFoundException('Gerät nicht gefunden');
    }
    await this.prisma.device.update({
      where: { id },
      data: { revokedAt: new Date(), tokenHash: hashToken(generateToken()) },
    });
    return { revoked: true };
  }
}
