import { IsIn } from 'class-validator';

export class PerspectiveDto {
  @IsIn(['공식 중심', '단계별', '시각화', '실생활 예시'])
  perspective!: '공식 중심' | '단계별' | '시각화' | '실생활 예시';
}
