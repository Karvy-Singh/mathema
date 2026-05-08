import { Module } from '@nestjs/common';
import { WrongNotesController } from './wrong-notes.controller';
import { WrongNotesService } from './wrong-notes.service';
import { WrongNotesRepository } from './wrong-notes.repository';
import { OcrService } from './services/ocr.service';
import { PdfExtractorService } from './services/pdf-extractor.service';
import { SimilarFinderService } from './services/similar-finder.service';
import { SpacedRepetitionService } from './services/spaced-repetition.service';

/**
 * 오답노트 — 오답노트 페이지 전체 + 대시보드 "최근 오답 인사이트" 카드.
 * 사진/직접/PDF 3가지 등록 경로, AI 인사이트 자동 생성, 유사문제 추천,
 * SM-2 간격 반복(망각 곡선 대응) 포함.
 */
@Module({
  controllers: [WrongNotesController],
  providers: [
    WrongNotesService,
    WrongNotesRepository,
    OcrService,
    PdfExtractorService,
    SimilarFinderService,
    SpacedRepetitionService,
  ],
  exports: [WrongNotesService, SpacedRepetitionService, WrongNotesRepository],
})
export class WrongNotesModule {}
