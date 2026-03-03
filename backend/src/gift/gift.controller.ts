import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { UserId } from '@/decorators/userid.decorator';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GiftService } from './gift.service';
import { TelegramPremiumMonth } from '@prisma/client';

@Controller('gift')
@UseGuards(JwtAuthGuard)
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  @Get()
  findAll() {
    return this.giftService.findAll();
  }

  @Get('featured')
  getFeatured() {
    return this.giftService.getFeatured();
  }

  @Get('shop-products')
  getShopProducts() {
    return this.giftService.getShopProducts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.giftService.findGiftById(id);
  }

 
  @Post('buy-gift')
  async buyGift(@UserId() userId: string, @Body() body: { giftId: string }) {
    console.log(body);
    return await this.giftService.buyGift(userId, body.giftId);
  }

 
  @Post('buy-shop-product')
  async buyShopProduct(
    @UserId() userId: string,
    @Body() body: { productId: string; targetUsername?: string },
  ) {
    console.log(body, "buy shop product");
    return await this.giftService.buyShopProduct(userId, body.productId, body.targetUsername);
  }
}
