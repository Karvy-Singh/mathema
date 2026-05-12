import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { WeeklyReportService } from './weekly-report.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, WeeklyReportService],
  exports: [ReportsService, WeeklyReportService],
})
export class ReportsModule {}
