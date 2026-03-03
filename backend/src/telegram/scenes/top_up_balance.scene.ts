import { Injectable } from "@nestjs/common";
import { Action, Ctx, Scene, SceneEnter } from "nestjs-telegraf";
import { Scenes } from "telegraf";
import { SCENES } from "../constants/telegram.constants";
import { Language } from "../decorators/language.decorator";
import { TelegramService } from "../telegram.service";

type SceneSession = Scenes.SceneContext & {
    session: Scenes.SceneSessionData & {
        language?: string;
    }
};

@Injectable()
@Scene(SCENES.TOP_UP_BALANCE)
export class TopUpBalanceScene {
    private language = 'ru'

    constructor(
        private telegramService: TelegramService,
    ) { }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: SceneSession, @Language() scene_lang: string) {
        this.language = scene_lang;

        const message = `💳 Выберите способ пополнения из предложенных:\n\n` +
            `💎 <b>TON | TON</b> - <i>оплата через нативный токен сети TON</i>\n` +
            `💳 <b>СБП</b> - <i>оплата рублями через QR-код</i>\n` +
            `🤖 <b>Cryptobot</b> - <i>оплата через Cryptobot</i>`;

        await this.telegramService.sendOrEditMessage(ctx,
            message,
            [
                [
                    { text: '💎 TON | Без комиссии', callback_data: 'payment_ton' }
                ],
                [
                    { text: '💵 USDT | Без комиссии', callback_data: 'payment_usdt' }
                ],
                [
                    { text: '🤖 Cryptobot | 3%', callback_data: 'payment_cryptobot' }
                ],
                [
                    { text: '💳 СБП Рубли | 9%', callback_data: 'payment_sbp' }
                ],
            ],
            true
        );
    }

    @Action('payment_ton')
    async onPaymentTon(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await ctx.scene.enter(SCENES.DEPOSIT_TON, { method: 'ton' });
    }

    @Action('payment_usdt')
    async onPaymentUsdtTon(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
    
        await ctx.scene.enter(SCENES.DEPOSIT_TON, { method: 'usdt' });
    }

    @Action('payment_rocket')
    async onPaymentRocket(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await ctx.reply('🚀 Оплата через Rocket\n\nФункционал в разработке', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Назад', callback_data: 'back_to_payment_methods' }]
                ]
            }
        });
    }

    @Action('payment_cryptobot')
    async onPaymentCryptobot(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await ctx.scene.enter(SCENES.DEPOSIT_CRYPTOBOT);
    }

    @Action('payment_sbp')
    async onPaymentSbp(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await ctx.scene.enter(SCENES.DEPOSIT_PLATEGA, { method: 'sbp' });
    }

    @Action('payment_other_crypto')
    async onPaymentOtherCrypto(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await ctx.scene.enter(SCENES.DEPOSIT_PLATEGA, { method: 'crypto' });
    }

    @Action('back_to_payment_methods')
    async onBackToPaymentMethods(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await this.onSceneEnter(ctx, this.language);
    }
}

