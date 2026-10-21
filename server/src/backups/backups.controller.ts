import {
  Body,
  Controller,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBackupDto } from './dto/create-backup.dto.js';
import { BackupsService } from './backups.service.js';

@Controller('backups')
export class BackupsController {
  constructor(private readonly backupService: BackupsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackup(
    @UploadedFile(new ParseFilePipe()) file: Express.Multer.File,
    @Body() dto: CreateBackupDto,
  ) {
    return await this.backupService.create(dto, file);
  }
}
