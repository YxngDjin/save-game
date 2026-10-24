import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import { BackupsModule } from './backups/backups.module.js';
import { GamesModule } from './games/games.module.js';
import { APP_GUARD } from '@nestjs/core';
import { DeviceAuthGuard } from './auth/device-auth.guard.js';
import { PairingModule } from './pairing/pairing.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ServeStaticModule.forRoot({
      rootPath: path.resolve(process.env.WEB_DIR ?? 'public'),
      renderPath: '/',
    }),
    PrismaModule,
    BackupsModule,
    GamesModule,
    PairingModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: DeviceAuthGuard },
  ],
})
export class AppModule {}
