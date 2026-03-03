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

// @UseGuards(UserCheckMiddleware)
@Update()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    protected readonly telegramService: TelegramService,
    protected readonly configService: ConfigService,
    protected readonly usersService: UsersService,
    protected readonly paymentService: PaymentService,
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

    await this.paymentService.createAndConfirmDepositStars(user.id, paymentId, new Decimal(stars));
    // this.telegramService.showDepositSuccess(user as IUser, new Decimal(stars));
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