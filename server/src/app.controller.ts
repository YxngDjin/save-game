import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { Public } from './auth/public.decorator.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  async gethealth() {
    const [devices, games, backups] = await Promise.all([
      this.prismaService.device.count(),
      this.prismaService.game.count(),
      this.prismaService.backup.count(),
    ]);
    return { status: 'ok', devices, games, backups };
  }
}
