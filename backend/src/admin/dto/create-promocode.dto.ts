import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  code: string;

  @IsInt()
  @Min(1)
  maxActivations: number;

  @IsInt()
  @Min(0)
  bonusStars: number;

  @IsOptional()
  validUntil?: string | null; // ISO date string
}
