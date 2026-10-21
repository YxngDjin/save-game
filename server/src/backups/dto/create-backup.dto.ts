import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
export class CreateBackupDto {
  @IsString() @IsNotEmpty() manifestName: string;
  @IsString() @IsNotEmpty() displayName: string;
  @IsOptional() @IsUUID() parentId?: string;
  @IsString() @Length(64, 64) contentHash: string;
  @IsString() launcher: string;
  @IsString() launcherId: string;
  @IsIn(['manual', 'auto', 'pre-restore']) reason: string;
  @Type(() => Number) @IsInt() @Min(0) fileCount: number;
  @Type(() => Number) @IsInt() @Min(0) sizeBytes: number;
  @IsISO8601() createdAt: string;
}
