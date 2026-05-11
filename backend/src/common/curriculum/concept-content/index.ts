/**
 * NCERT 7~12 개념학습 콘텐츠 — 학년별 파일 통합.
 */

import { ChapterContentMap } from './types';
import { CLASS_7_CONTENT } from './class-7';
import { CLASS_8_CONTENT } from './class-8';
import { CLASS_9_CONTENT } from './class-9';
import { CLASS_10_CONTENT } from './class-10';
import { CLASS_11_CONTENT } from './class-11';
import { CLASS_12_CONTENT } from './class-12';

export * from './types';

export const CHAPTER_CONTENT: ChapterContentMap = {
  ...CLASS_7_CONTENT,
  ...CLASS_8_CONTENT,
  ...CLASS_9_CONTENT,
  ...CLASS_10_CONTENT,
  ...CLASS_11_CONTENT,
  ...CLASS_12_CONTENT,
};
