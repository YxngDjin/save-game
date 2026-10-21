import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  private readonly adminKeyHash: Buffer;

  constructor(config: ConfigService) {
    const adminKey = config.getOrThrow<string>('ADMIN_KEY');
    this.adminKeyHash = createHash('sha256').update(adminKey).digest();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const given = request.headers['x-admin-key'];

    if (typeof given !== 'string') {
      throw new UnauthorizedException('Admin-Schlüssel fehlt');
    }

    const givenHash = createHash('sha256').update(given).digest();
    if (!timingSafeEqual(givenHash, this.adminKeyHash)) {
      throw new UnauthorizedException('Admin-Schlüssel falsch');
    }

    return true;
  }
}
