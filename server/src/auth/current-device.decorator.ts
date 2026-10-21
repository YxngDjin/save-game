import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Device } from '../generated/prisma/client.js';

export const CurrentDevice = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Device =>
    ctx.switchToHttp().getRequest().device,
);
