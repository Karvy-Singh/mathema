import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class StartSessionDto {
  @IsUUID() unitId!: string;
  @IsOptional() @IsInt() @Min(1) sessionNumber?: number;
  @IsOptional() @IsInt() @Min(1) totalSessions?: number;
  /** 세션 컨텍스트 — 학습/시험/연습/진단 (default: STUDY) */
  @IsOptional() @IsIn(['STUDY', 'EXAM', 'PRACTICE', 'DIAGNOSTIC']) context?: string;
  /** 클라이언트가 보내는 디바이스 종류 ('android' | 'ios' | 'web') */
  @IsOptional() @IsString() deviceType?: string;
}
