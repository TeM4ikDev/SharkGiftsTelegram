import { DatabaseService } from '@/database/database.service';
import { PaymentService } from '@/payment/payment.service';
import { UsersService } from '@/users/users.service';
import { Injectable } from '@nestjs/common';
import { Action, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { SceneContext as SceneContextType } from 'telegraf/typings/scenes';
import { PlategaService } from '../../../payment/services/platega.service';
import { SCENES } from '../../constants/telegram.constants';
import { TelegramService } from '../../telegram.service';

type PlategaMethod = 'sbp' | 'crypto';

interface IPlategaSceneState {
  method: PlategaMethod;
  userId: string;
}

type SceneSession = Scenes.SceneContext & {
  session: Scenes.SceneSessionData & {
    formData: {
      step: number;
      amountInRub?: number;
    };
  };
  scene: Scenes.SceneContextScene<SceneSession> & {
    state: IPlategaSceneState;
  };
};

@Injectable()
@Scene(SCENES.DEPOSIT_PLATEGA)
export class PlategaDepositScene {
  private minAmount = 50; // Минимальная сумма в рублях

  constructor(
    private readonly telegramService: TelegramService,
    private readonly plategaService: PlategaService,
    private readonly database: DatabaseService,
    private readonly usersService: UsersService,
    private readonly paymentService: PaymentService,
  ) { }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SceneSession) {
    const method = ctx.scene.state.method;
    const methodName = method === 'sbp' ? 'СБП (Рубли)' : 'Криптовалюту';

    const user = await this.usersService.findUserByTelegramId(ctx.from.id.toString());
    ctx.scene.state.userId = user.id;
    ctx.session.formData = { step: 1 };

    await this.telegramService.sendOrEditMessage(
      ctx,
      `💳 <b>Пополнение через Platega [${methodName}]</b>\n\n` +
      `💡 Минимальная сумма: <code>${this.minAmount} RUB</code>\n\n` +
      `❗️ Комиссия платёжной системы составляет 9%. \n` +
      `Введите сумму пополнения в рублях:`,
      [],
      true,
      'back_to_topup'
    );
  }

  @Action('back_to_topup')
  async onBackToTopUp(@Ctx() ctx: SceneSession) {
    await ctx.answerCbQuery();
    await ctx.scene.enter(SCENES.TOP_UP_BALANCE);
  }

  @On('text')
  async onText(@Ctx() ctx: SceneSession) {
    if (ctx.session.formData?.step !== 1) return;

    const text = (ctx.message as any)?.text;
    const amount = parseFloat(text);

    if (isNaN(amount) || amount < this.minAmount) {
      await ctx.reply(`❌ Неверная сумма. Введите положительное число в рублях.\n\nНапример: <code>100</code> или <code>255.5</code>`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬅️ Отмена', callback_data: 'cancel_deposit' }]
            ]
          }
        }
      );
      return
    }

    const method = ctx.scene.state.method;
    const paymentMethod = method === 'sbp' ? 2 : 13; // 2 - СБП, 13 - Крипто по доке

    ctx.session.formData.amountInRub = amount;
    ctx.session.formData.step = 2;

    try {
      const transaction = await this.plategaService.createTransaction({
        userId: ctx.scene.state.userId,
        paymentMethod,
        amount,
        description: `Пополнение баланса пользователя ${ctx.from.first_name}(${ctx.from.id})`,
        payload: JSON.stringify({ userId: ctx.from.id, type: 'deposit' }),
      });

      await this.telegramService.sendOrEditMessage(
        ctx,
        `✅ <b>Счет сформирован!</b>\n\n` +
        `💰 Сумма: <code>${amount} RUB</code>\n` +
        `💰 Сумма к получению: <code>${amount * 0.91} RUB</code>\n` +
        `🔗 Для оплаты нажмите кнопку ниже:`,
        [
          [{ text: '💳 Перейти к оплате', url: transaction.redirect }],
        ],
        true
      );
      await ctx.scene.leave();
    } catch (error) {
      await ctx.reply('❌ Произошла ошибка при создании счета. Попробуйте позже.');
      console.error(error);
      await ctx.scene.leave();
    }

  }

  @Action('cancel_deposit')
  async onCancelDeposit(@Ctx() ctx: SceneContextType) {
    await ctx.scene.leave();
    await ctx.reply("Пополнение отменено")
    await ctx.answerCbQuery();
  }

}

