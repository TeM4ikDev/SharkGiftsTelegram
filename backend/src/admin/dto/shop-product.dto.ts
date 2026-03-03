import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const SHOP_PRODUCT_TYPES = ['PREMIUM', 'STARS', 'GIFT'] as const;

export class CreateShopProductDto {
  @IsIn(SHOP_PRODUCT_TYPES)
  type: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  priceInStars: number;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  premiumMonths?: string | null; // TelegramPremiumMonth: MONTHS_3 | MONTHS_6 | MONTHS_12
}

export class UpdateShopProductDto {
  @IsOptional()
  @IsIn(SHOP_PRODUCT_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceInStars?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  premiumMonths?: string | null;
}
