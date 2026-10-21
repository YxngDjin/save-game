import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Device } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { IS_PUBLIC } from './public.decorator.js';
import { hashToken } from './token.js';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { device?: Device }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Kein Token angegeben');
    }

    const device = await this.prisma.device.findUnique({
      where: { tokenHash: hashToken(header.slice('Bearer '.length)) },
    });
    if (!device) {
      throw new UnauthorizedException('Ungültiger Token');
    }

    request.device = device;
    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });
    return true;
  }
}
