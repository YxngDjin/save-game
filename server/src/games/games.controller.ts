import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { GamesService } from './games.service.js';

@Controller('games')
export class GamesController {
  constructor(private readonly game: GamesService) {}

  @Get()
  async getAllGames() {
    return await this.game.findAll();
  }

  @Get(':id/backups')
  async getGameById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.game.findBackups(id);
  }
}
