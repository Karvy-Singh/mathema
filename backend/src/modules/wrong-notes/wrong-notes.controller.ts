import { Controller, Get, Post, Patch, Body, Query, Param, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WrongNotesService } from './wrong-notes.service';
import { CreateWrongNoteDto } from './dto/create-wrong-note.dto';
import { QueryWrongNotesDto } from './dto/query-wrong-notes.dto';
import { ReviewWrongNoteDto } from './dto/review-wrong-note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';

/**
 * 오답노트 라우트.
 * UI ↔ 라우트:
 *  - 오답노트 페이지 헤더 4 stat        → GET /stats
 *  - 그리드 + 필터/정렬                 → GET /
 *  - 사진 등록                          → POST /upload-photo
 *  - 직접 입력                          → POST /
 *  - PDF 업로드                         → POST /upload-pdf
 *  - 단건 + 유사문제                    → GET /:id
 *  - 상태 변경 (analyzing → mastered)   → PATCH /:id/status
 *  - 대시보드 최근 오답 카드 3개        → GET /recent
 */
@UseGuards(JwtAuthGuard)
@Controller('wrong-notes')
export class WrongNotesController {
  constructor(private readonly service: WrongNotesService) {}

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.service.getStats(userId);
  }

  @Get('recent')
  getRecent(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Query('limit') limit = 3) {
    return this.service.getRecent(userId, +limit, lang);
  }

  @Get('due')
  getDue(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Query('limit') limit?: string) {
    return this.service.getDue(userId, limit ? +limit : undefined, lang);
  }

  @Get()
  list(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Query() query: QueryWrongNotesDto) {
    return this.service.list(userId, query, lang);
  }

  @Get(':id')
  getOne(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Param('id') id: string) {
    return this.service.getOne(userId, id, lang);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWrongNoteDto) {
    return this.service.create(userId, dto);
  }

  @Post('upload-photo')
  @UseInterceptors(FileInterceptor('image'))
  uploadPhoto(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadPhoto(userId, file, lang);
  }

  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('pdf'))
  uploadPdf(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadPdf(userId, file, lang);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.service.updateStatus(userId, id, status);
  }

  @Post(':id/review')
  review(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReviewWrongNoteDto,
  ) {
    return this.service.review(userId, id, dto);
  }
}
