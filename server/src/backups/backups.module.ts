import { Module } from '@nestjs/common';
import { BackupsController } from './backups.controller.js';
import { BackupsService } from './backups.service.js';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import path from 'path';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dest: path.join(
          path.resolve(config.getOrThrow<string>('DATA_DIR')),
          'tmp',
        ),
        limits: { fileSize: 2 * 1024 * 1024 * 1024 },
      }),
    }),
  ],
  controllers: [BackupsController],
  providers: [BackupsService],
})
export class BackupsModule {}
