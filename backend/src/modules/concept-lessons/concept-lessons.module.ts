import { Module } from '@nestjs/common';
import { ConceptLessonsController } from './concept-lessons.controller';
import { ConceptLessonsService } from './concept-lessons.service';

@Module({
  controllers: [ConceptLessonsController],
  providers: [ConceptLessonsService],
  exports: [ConceptLessonsService],
})
export class ConceptLessonsModule {}
