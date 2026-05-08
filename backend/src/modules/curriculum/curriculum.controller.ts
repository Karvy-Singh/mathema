import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}
  @Get() tree() { return this.service.tree(); }
}
