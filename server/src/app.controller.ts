import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { randomUUID } from 'node:crypto';

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

  @Get('health')
  async gethealth() {
    const [devices, games, backups] = await Promise.all([
      await this.prismaService.device.count(),
      await this.prismaService.game.count(),
      await this.prismaService.backup.count(),
    ]);
    return { status: 'ok', devices, games, backups };
  }

  @Post('dev/device')
  async createDevDevice() {
    return this.prismaService.device.create({
      data: { name: 'Gaming-PC', tokenHash: randomUUID() },
    });
  }
}
