import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBackupDto } from './dto/create-backup.dto.js';
import { BackupsService } from './backups.service.js';
import { CurrentDevice } from '../auth/current-device.decorator.js';
import type { Device } from '../generated/prisma/client.js';

@Controller('backups')
export class BackupsController {
  constructor(private readonly backupService: BackupsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackup(
    @UploadedFile(new ParseFilePipe()) file: Express.Multer.File,
    @Body() dto: CreateBackupDto,
    @CurrentDevice() device: Device,
  ) {
    return await this.backupService.create(dto, file, device.id);
  }

  @Get(':id/download')
  async download(@Param('id', ParseUUIDPipe) id: string) {
    const { backup, size, stream } = await this.backupService.getFile(id);
    return new StreamableFile(stream, {
      type: 'application/zip',
      disposition: `attachment; filename="${backup.id}.zip"`,
      length: size,
    });
  }
}
