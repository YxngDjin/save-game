import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ClaimDto {
  @Matches(/^\d{6}$/) code: string;
  @IsString() @IsNotEmpty() @Length(1, 50) deviceName: string;
}
