import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WrongNotesRepository } from './wrong-notes.repository';
import { OcrService } from './services/ocr.service';
import { PdfExtractorService } from './services/pdf-extractor.service';
import { SimilarFinderService } from './services/similar-finder.service';
import { SpacedRepetitionService } from './services/spaced-repetition.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateWrongNoteDto } from './dto/create-wrong-note.dto';
import { QueryWrongNotesDto } from './dto/query-wrong-notes.dto';
import { ReviewWrongNoteDto } from './dto/review-wrong-note.dto';

@Injectable()
export class WrongNotesService {
  constructor(
    private readonly repo: WrongNotesRepository,
    private readonly ocr: OcrService,
    private readonly pdf: PdfExtractorService,
    private readonly similar: SimilarFinderService,
    private readonly sr: SpacedRepetitionService,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  getStats(userId: string) { return this.repo.aggregateStats(userId); }
  getRecent(userId: string, limit: number) { return this.repo.findRecent(userId, limit); }
  list(userId: string, query: QueryWrongNotesDto) { return this.repo.list(userId, query); }
  getDue(userId: string, limit?: number) { return this.repo.findDue(userId, limit); }
  async getOne(userId: string, id: string) {
    const note = await this.repo.findOne(userId, id);
    const similar = await this.similar.findSimilar(note.problemId, 5);
    return { ...note, similar };
  }
  create(userId: string, dto: CreateWrongNoteDto) { return this.repo.create(userId, dto); }
  async uploadPhoto(userId: string, file: Express.Multer.File) {
    if (!file) return { ok: false, message: 'file required' };
    return { ok: true, message: '사진 등록 — Vision API 연동(api입력칸) 후 자동 인식됩니다.' };
  }
  async uploadPdf(userId: string, file: Express.Multer.File) {
    if (!file) return { ok: false, message: 'file required' };
    return { ok: true, message: 'PDF 일괄 추출 — LLM 연동(api입력칸) 후 자동 분리됩니다.' };
  }

  async updateStatus(userId: string, id: string, status: string) {
    const updated = await this.repo.updateStatus(userId, id, status as any);
    if (status === 'MASTERED') {
      this.events.emit('wrong-note.mastered', { userId, problemId: updated.problemId });
    }
    return updated;
  }

  /**
   * SM-2 복습 처리.
   * 4단계 quality(AGAIN/HARD/GOOD/EASY) → SM-2 갱신.
   * 연속 EASY 3회 이상 시 자동 MASTERED 처리.
   */
  async review(userId: string, id: string, dto: ReviewWrongNoteDto) {
    const current = await this.prisma.wrongNote.findFirstOrThrow({
      where: { id, userId },
    });
    const q = SpacedRepetitionService.parseQuality(dto.quality);
    const sm2 = this.sr.apply({
      easinessFactor: current.easinessFactor,
      repetitionCount: current.repetitionCount,
      intervalDays: current.intervalDays,
    }, q);

    const updated = await this.repo.applyReview(userId, id, sm2);

    // 자동 MASTERED: 연속 EASY 3회 + 간격 30일 이상이면 졸업
    if (q === 5 && updated.repetitionCount >= 3 && updated.intervalDays >= 30) {
      await this.repo.updateStatus(userId, id, 'MASTERED' as any);
      this.events.emit('wrong-note.mastered', { userId, problemId: updated.problemId });
    }

    return {
      id: updated.id,
      easinessFactor: Math.round(updated.easinessFactor * 100) / 100,
      repetitionCount: updated.repetitionCount,
      intervalDays: updated.intervalDays,
      nextReviewAt: updated.nextReviewAt?.toISOString() ?? null,
      lapsed: sm2.lapsed,
      autoMastered: q === 5 && updated.repetitionCount >= 3 && updated.intervalDays >= 30,
    };
  }
}
