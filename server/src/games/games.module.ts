import { Module } from '@nestjs/common';
import { GamesService } from './games.service.js';
import { GamesController } from './games.controller.js';

@Module({
  providers: [GamesService],
  controllers: [GamesController],
})
export class GamesModule {}
