import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../auth/public.decorator.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';
import {
  ADMIN_COOKIE,
  AdminSessionService,
  SESSION_LIFETIME_MS,
} from './admin-session.service.js';
import { LoginDto } from './dto/login.dto.js';
import { GamesService } from '../games/games.service.js';

@Public()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly sessions: AdminSessionService,
    private readonly adminService: AdminService,
    private readonly gamesService: GamesService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    if (!this.sessions.verifyKey(dto.key)) {
      throw new UnauthorizedException('Admin-Schlüssel falsch');
    }
    res.cookie(ADMIN_COOKIE, this.sessions.create(), {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: SESSION_LIFETIME_MS,
      path: '/',
    });
    return { loggedIn: true };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.sessions.destroy(req.cookies?.[ADMIN_COOKIE]);
    res.clearCookie(ADMIN_COOKIE, { path: '/' });
    return { loggedIn: true };
  }

  @Get('me')
  @UseGuards(AdminGuard)
  me() {
    return { loggedIn: true };
  }

  @Get('devices')
  @UseGuards(AdminGuard)
  listDevices() {
    return this.adminService.listDevices();
  }

  @Post('devices/:id/revoke')
  @HttpCode(200)
  @UseGuards(AdminGuard)
  revokeDevice(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.revokeDevice(id);
  }

  @Get('games')
  @UseGuards(AdminGuard)
  listGames() {
    return this.gamesService.findAll();
  }

  @Get('games/:id/backups')
  @UseGuards(AdminGuard)
  listGameBackups(@Param('id', ParseUUIDPipe) id: string) {
    return this.gamesService.findBackups(id);
  }
}
