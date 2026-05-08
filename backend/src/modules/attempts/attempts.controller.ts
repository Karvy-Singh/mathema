import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly service: AttemptsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }
}
