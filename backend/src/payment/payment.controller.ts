import { TelegramService } from '@/telegram/telegram.service';
import { UsersService } from '@/users/users.service';
import { BadGatewayException, Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UserId } from '@/decorators/userid.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Decimal } from '@prisma/client/runtime/library';
import { TelegramClient } from '@/telegram/updates/TelegramClient';


interface IPlategaWebhookBody {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: number;
}

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly usersService: UsersService,
    private readonly telegramService: TelegramService,
    private readonly telegramClient: TelegramClient

  ) { }

  private giftPrices = 50

  @Post("get-invoice-link")
  async getInvoiceLink(
    @UserId() userId: string,
    @Body() body: { username: string; giftsValue: number; amount: number; giftId: string; message?: string; paymentMethod: "stars" | "cryptobot" },
  ) {
    let invoiceLink;
    const globalConfig = this.telegramService.getGlobalConfig()

    console.log(body)

    if (body.paymentMethod === "stars") {
      invoiceLink = await this.paymentService.createStarsInvoiceLink(
        userId,
        body.amount,
        body.username,
        body.giftId,
        body.giftsValue,
        body.message,
      );
    } 
    // else if (body.paymentMethod === "cryptobot") {
    //   const amountInUsdWithCommission = (body.amount * Number(globalConfig.starRateInUsd)) / 0.97;
    //   invoiceLink = await this.paymentService.createCryptoBotInvoiceLink(userId, amountInUsdWithCommission, body.amount);
    // }

    return {
      invoiceLink: invoiceLink
    }
  }

  @Post("send-deposit-data")
  async sendDepositData(
    @UserId() userId: string,
    @Body()
    body: {
      boc: string;
      username: string;
      giftId: string;
      giftAmount: number;
      amountInStars: number;
      amountInTon: number;
      message?: string;
      memo: string;
    },
  ) {
    console.log(body)

    return await this.paymentService.createDepositTon(
      userId,
      body.boc,
      body.username,
      body.giftId,
      body.giftAmount,
      new Decimal(body.amountInStars),
      new Decimal(body.amountInTon),
      body.message,
      body.memo,
    );
  }




}
