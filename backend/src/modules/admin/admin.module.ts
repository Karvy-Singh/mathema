import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminAuditInterceptor } from './admin-audit.interceptor';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminGuard,
    AdminAuditInterceptor,
  ],
})
export class AdminModule {}
