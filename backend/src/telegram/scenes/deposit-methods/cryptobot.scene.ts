import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import axios from 'axios';
import { Action, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { PaymentService } from '../../../payment/payment.service'; // Предполагаем, что тут метод создания счета
import { SCENES } from '../../constants/telegram.constants';
import { TelegramService } from '../../telegram.service';

type SceneSession = Scenes.SceneContext & {
    session: Scenes.SceneSessionData & {
        formData: {
            step: number;
            amountInRub?: number;
        };
    };
}

@Injectable()
@Scene(SCENES.DEPOSIT_CRYPTOBOT)
export class DepositCryptoBotScene {
    private minDepositAmount = 50; // Минимум 100 руб


    constructor(
        private readonly paymentService: PaymentService,
        private readonly telegramService: TelegramService,
        private readonly configService: ConfigService,
    ) { }

    private token = this.configService.get('CRYPTOBOT_API_TOKEN');



    //  https://testnet-pay.crypt.bot/
    // https://pay.crypt.bot/api
    private instance = axios.create({
        baseURL: 'https://pay.crypt.bot/api',
        headers: {
            'Crypto-Pay-API-Token': this.token,
            'Content-Type': 'application/json',
        },
    });

    async createInvoice(amount: string, telegramId: string) {


        const response = await this.instance.post('/createInvoice',
            {
                currency_type: 'fiat',

                // Для фиата поле 'fiat' является обязательным, а 'asset' не используется
                fiat: 'RUB',

                // Сумма счета в формате float (строкой)
                amount: amount,

                // Опционально: список валют, которыми можно оплатить
                accepted_assets: 'USDT,TON,BTC',

                // Данные для обработки вебхука (до 4kb)
                payload: telegramId,

                description: 'Пополнение баланса',

                // Настройка кнопки возврата после оплаты
                paid_btn_name: 'callback',
                paid_btn_url: 'https://t.me/clashstarsbot'
            },
        );

        const data = response.data;
        console.log(data);

        // await this.paymentService.createDepositCryptoBot(telegramId, data.result.invoice_id.toString(), new Decimal(amount));




        return data.result.bot_invoice_url; // Ссылка, которую нужно дать пользователю
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: SceneSession) {
        ctx.session.formData = { step: 1 };

        await this.telegramService.sendOrEditMessage(ctx,
            `💳 <b>Пополнение через Crypto Bot</b>\n\n` +
            `❗️ Комиссия платёжной системы составляет 3%. \n` +
            `💡 Минимальная сумма: <code>${this.minDepositAmount} RUB</code>\n\n` +
            `💵 <b>Введите сумму в рублях:</b>`,
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

        if (isNaN(amount) || amount < this.minDepositAmount) {

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

        ctx.session.formData.amountInRub = amount;
        ctx.session.formData.step = 2;

        const botInvoiceUrl = await this.createInvoice(
            amount.toString(),
            ctx.from.id.toString()
        );


        await this.telegramService.sendOrEditMessage(
            ctx,
            `✅ <b>Счет сформирован!</b>\n\n` +
            `💰 Сумма: <code>${amount} RUB</code>\n` +
            `💰 Сумма к получению: <code>${amount * 0.97} RUB</code>\n` +
            `🔗 Для оплаты нажмите кнопку ниже:`,
            [
                [{ text: '💳 Перейти к оплате', url: botInvoiceUrl }],
            ],
            true
        );
        await ctx.scene.leave();
    }



    @Action('cancel_deposit')
    async onCancel(@Ctx() ctx: SceneSession) {
        await ctx.scene.leave();
        await ctx.reply('Пополнение отменено');
        await ctx.answerCbQuery();
    }
}