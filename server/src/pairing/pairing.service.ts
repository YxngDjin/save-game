import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { randomInt } from 'node:crypto';
import { generateToken, hashToken } from '../auth/token.js';

const CODE_LIFETIME_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface PendingCode {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class PairingService {
  private pending: PendingCode | null = null;

  constructor(private readonly prisma: PrismaService) {}

  createCode() {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = Date.now() + CODE_LIFETIME_MS;
    this.pending = { code, expiresAt, attempts: 0 };
    return { code, expiresAt: new Date(expiresAt).toISOString() };
  }

  async claim(code: string, deviceName: string) {
    const pending = this.pending;
    if (!pending || pending.expiresAt < Date.now()) {
      this.pending = null;
      throw new UnauthorizedException('Kein Gültiger Code vorhanden');
    }

    if (pending.code !== code) {
      pending.attempts += 1;
      if (pending.attempts >= MAX_ATTEMPTS) {
        this.pending = null;
      }
      throw new UnauthorizedException('Code falsch');
    }

    this.pending = null;
    const token = generateToken();
    const device = await this.prisma.device.create({
      data: {
        name: deviceName,
        tokenHash: hashToken(token),
      },
    });

    return { deviceId: device.id, deviceName: device.name, token };
  }
}
