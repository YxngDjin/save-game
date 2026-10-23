import { Global, Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminSessionService } from './admin-session.service.js';

@Global()
@Module({
  controllers: [AdminController],
  providers: [AdminSessionService, AdminService],
  exports: [AdminSessionService],
})
export class AdminModule {}
