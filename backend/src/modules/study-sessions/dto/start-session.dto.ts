import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class StartSessionDto {
  @IsUUID() unitId!: string;
  @IsOptional() @IsInt() @Min(1) sessionNumber?: number;
  @IsOptional() @IsInt() @Min(1) totalSessions?: number;
}
