import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** 사진/PDF 업로드 저장소. 로컬/S3 어댑터 분기. */
@Injectable()
export class StorageService {
  private readonly driver: string;
  constructor(config: ConfigService) {
    this.driver = config.get<string>('storage.driver') ?? 'local';
  }

  async save(_buffer: Buffer, _key: string): Promise<string> {
    // TODO: driver === 's3' ? S3 putObject : 로컬 파일 저장
    return '';
  }
}
