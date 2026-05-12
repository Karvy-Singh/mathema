import { Module } from '@nestjs/common';
import { ConceptLessonsController } from './concept-lessons.controller';
import { ConceptLessonsService } from './concept-lessons.service';
import { ConceptLessonsBootstrap } from './concept-lessons.bootstrap';

@Module({
  controllers: [ConceptLessonsController],
  providers: [ConceptLessonsService, ConceptLessonsBootstrap],
  exports: [ConceptLessonsService],
})
export class ConceptLessonsModule {}
