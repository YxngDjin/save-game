import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PairingService } from './pairing.service.js';
import { Public } from '../auth/public.decorator.js';
import { AdminKeyGuard } from '../auth/admin-key.guard.js';
import { ClaimDto } from './dto/claim.dto.js';
import { Throttle } from '@nestjs/throttler';

@Public()
@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Controller('pairing')
export class PairingController {
  constructor(private readonly pairingService: PairingService) {}

  @Post('codes')
  @UseGuards(AdminKeyGuard)
  create() {
    return this.pairingService.createCode();
  }

  @Post('claim')
  async claim(@Body() dto: ClaimDto) {
    return await this.pairingService.claim(dto.code, dto.deviceName);
  }
}
