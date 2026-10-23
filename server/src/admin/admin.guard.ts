import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ADMIN_COOKIE, AdminSessionService } from './admin-session.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly sessions: AdminSessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const key = request.headers['x-admin-key'];
    if (typeof key === 'string' && this.sessions.verifyKey(key)) {
      return true;
    }

    if (this.sessions.isValid(request.cookies?.[ADMIN_COOKIE])) {
      return true;
    }

    throw new UnauthorizedException('Admin Anmeldung erforderlich');
  }
}
