import { ActionParam, ActionWithData } from '@/decorators/telegram.decorator';
import { PaymentService } from '@/payment/payment.service';
import { UsersService } from '@/users/users.service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SuccessfulPayment } from 'telegraf/typings/core/types/typegram';
import { SceneContext } from 'telegraf/typings/scenes';
import { TelegramService } from './telegram.service';
import { Decimal } from '@prisma/client/runtime/library';
import { IUser } from '@/types/types';
import { TelegramClient } from './updates/TelegramClient';

// @UseGuards(UserCheckMiddleware)
@Update()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    protected readonly telegramService: TelegramService,
    protected readonly configService: ConfigService,
    protected readonly usersService: UsersService,
    protected readonly paymentService: PaymentService,
    protected readonly telegramClient: TelegramClient,
  ) { }

  @On('pre_checkout_query')
  async onPreCheckout(@Ctx() ctx: Context) {
    await ctx.answerPreCheckoutQuery(true);
  }

  @On('successful_payment')
  async onSuccessfulPayment(@Ctx() ctx: Context) {
    const payment: SuccessfulPayment = (ctx.message as any).successful_payment;
    const paymentId = payment.telegram_payment_charge_id;

    const stars = payment.total_amount
    const user = await this.usersService.findUserByTelegramId(ctx.from.id.toString());


    const depositId = payment.invoice_payload;
    console.log('Stars successful_payment, depositId:', depositId);

    const deposit = await this.paymentService.getDepositWithStarsById(depositId);
    if (!deposit) {
      this.logger.error(`Deposit not found for id=${depositId}`);
      return;
    }

    if (deposit.status !== 'PENDING') {
      this.logger.log(`Deposit ${deposit.id} already processed with status=${deposit.status}`);
      return;
    }

    if (!deposit.stars) {
      this.logger.error(`Deposit ${deposit.id} has no stars relation`);
      return;
    }

    const { recipientUsername, giftId, giftAmount, message, isAnonymous } = deposit.stars;

    for (let i = 0; i < (giftAmount || 1); i++) {
      await this.telegramClient.sendGiftToTelegramUser(recipientUsername, giftId, message || '', isAnonymous ?? true);
    }

    await this.paymentService.markDepositCompleted(deposit.id);
  }

  @On('refunded_payment' as any)
  async onRefund(@Ctx() ctx: Context) {
    const refund = (ctx.message as any).refunded_payment;
    const telegramOperationId = refund.telegram_payment_charge_id;
    const amount = refund.total_amount;

    console.log(`Пользователь вернул товар! Списано: ${amount} звезд. Сделка: ${telegramOperationId}`);

    // await this.paymentService.refundSellStars(telegramOperationId);
  }

}