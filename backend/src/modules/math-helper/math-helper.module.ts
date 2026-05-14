import { Module } from '@nestjs/common';
import { MathHelperController } from './math-helper.controller';
import { MathHelperService } from './math-helper.service';

@Module({
  controllers: [MathHelperController],
  providers: [MathHelperService],
})
export class MathHelperModule {}
