import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { PushController } from './push.controller';

@Module({
  controllers: [PushController],
  providers: [FcmService],
  exports: [FcmService],
})
export class PushModule {}
