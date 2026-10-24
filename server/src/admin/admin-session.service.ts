import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import { generateToken, hashToken } from '../auth/token.js';

export const ADMIN_COOKIE = 'savegame_admin';
export const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AdminSessionService {
  private readonly adminKeyHash: Buffer;
  private readonly sessions = new Map<string, number>();

  constructor(config: ConfigService) {
    this.adminKeyHash = createHash('sha256')
      .update(config.getOrThrow<string>('ADMIN_KEY'))
      .digest();
  }

  verifyKey(key: string): boolean {
    const given = createHash('sha256').update(key).digest();
    return timingSafeEqual(given, this.adminKeyHash);
  }

  create(): string {
    const sessionId = generateToken();
    this.sessions.set(hashToken(sessionId), Date.now() + SESSION_LIFETIME_MS);
    return sessionId;
  }

  isValid(sessionId: unknown): boolean {
    if (typeof sessionId !== 'string') {
      return false;
    }
    const key = hashToken(sessionId);
    const expiresAt = this.sessions.get(key);
    if (expiresAt === undefined) {
      return false;
    }
    if (expiresAt < Date.now()) {
      this.sessions.delete(key);
      return false;
    }
    return true;
  }

  destroy(sessionId: unknown) {
    if (typeof sessionId === 'string') {
      this.sessions.delete(hashToken(sessionId));
    }
  }
}
