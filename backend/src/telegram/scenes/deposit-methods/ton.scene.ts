import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GlobalConfig } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Action, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { PaymentService } from '../../../payment/payment.service';
import { SCENES } from '../../constants/telegram.constants';
import { TelegramService } from '../../telegram.service';



type Method = 'ton' | 'usdt';

interface IDepositTonFormData {
    step: number;
    amountInRub?: Decimal,
    amountInUsd?: Decimal,
    amountInTon?: Decimal,

    method: Method;

}

interface IDepositTonSceneState {
    method: Method;
}

type SceneSession = Scenes.SceneContext & {
    session: Scenes.SceneSessionData & {
        formData: IDepositTonFormData;
        language?: string;
    };
    scene: Scenes.SceneContextScene<SceneSession> & {
        state: IDepositTonSceneState;
    };
};

@Injectable()
@Scene(SCENES.DEPOSIT_TON)
export class DepositTonScene {
    private targetAddress = this.configService.get('TARGET_WALLET_ADDRESS');
    private usdtMasterAddress = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'; // USDT master address
    private globalConfig: GlobalConfig = null
    private minDepositAmountInRub = new Decimal(50);

    constructor(
        private readonly paymentService: PaymentService,
        private readonly configService: ConfigService,
        private readonly telegramService: TelegramService,
    ) { }

    private createTonkeeperUrl(amount: number | any, payload: string, method: Method): string {
        const amountDecimal = typeof amount === 'object' && amount?.mul ? amount : new Decimal(amount);
        
        if (method === 'ton') {
            const amountInNano = amountDecimal.mul(1000000000).toFixed(0);
            return `https://app.tonkeeper.com/transfer/${this.targetAddress}?amount=${amountInNano}&text=${encodeURIComponent(payload)}`;
        } else { 
            // https://docs.tonconsole.com/tonkeeper/deep-linking
            const amountInUsdtUnits = amountDecimal.mul(1000000).toFixed(0);
            return `https://app.tonkeeper.com/transfer/${this.targetAddress}?jetton=${this.usdtMasterAddress}&amount=${amountInUsdtUnits}&text=${encodeURIComponent(payload)}`;
        }
    }

        private renderRateMessage(ctx: SceneSession): string {
            // return `📈 Курс: <code>1 ${this.renderMethodMessage(ctx)} = ${this.telegramService.showPrice( ctx.scene.state.method === 'ton' ? this.globalConfig.buyTonRateInRub : this.globalConfig.usdToRubRate)}</code>`;
            return `📈 Курс: <code>1 ${this.renderMethodMessage(ctx)} = ${this.globalConfig.tonRateInUsd.toFixed(2)}</code>`;
        }

    private renderMinDepositMessage(): string {
        return `💡<b>Минимальная сумма пополнения: ${this.telegramService.showPrice(this.minDepositAmountInRub)}</b>`;
    }

    private renderMethodMessage(ctx: SceneSession, withNetwork: boolean = false): string {
        return `<code>${ctx.scene.state.method === 'ton' ? (withNetwork ? 'TON | Сеть Ton' : 'TON') : (withNetwork ? 'USDT | Сеть Ton' : 'USDT')}</code>`
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: SceneSession) {
        this.globalConfig = this.telegramService.getGlobalConfig();
        
        ctx.session.formData = {
            step: 1,
            amountInRub: new Decimal(0),
            amountInTon: new Decimal(0),
            method: ctx.scene.state.method,
        };

        await this.telegramService.sendOrEditMessage(ctx,
            `💰 <b>Депозит через ${this.renderMethodMessage(ctx, true)}</b>\n\n${this.renderMinDepositMessage()}\n${this.renderRateMessage(ctx)}\n\n💵 <b>Введите сумму депозита в рублях (RUB):</b>\nНапример: <code>100</code> или <code>255.5</code>`,
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



    @Action('pay_deposit')
    async onPayDeposit(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();

        const amount = ctx.scene.state.method === 'ton' ? ctx.session.formData.amountInTon : ctx.session.formData.amountInUsd;
        // const memo = await this.paymentService.createDeposit(ctx.from.id.toString());

        // await this.telegramService.sendOrEditMessage(ctx,
        //     `💰 <b>Депозит через ${this.renderMethodMessage(ctx, true)}</b>\n\n` +
        //     `📊 Сумма: <code>${amount.toFixed(4)} </code>${this.renderMethodMessage(ctx)}\n` +
        //     `📤 Отправьте эту сумму на адрес в <code>${this.renderMethodMessage(ctx)}</code>:\n<code>${this.targetAddress}</code>\n\n` +
        //     `🔑 <u><b>Обязательно укажите мемо:</b></u>\n` +
        //     `<code>${memo}</code>\n\n` +
        //     `⚠️ <b>Важно:</b> Без правильного мемо платеж не будет зачислен!\n\n`,
        //     [],
        //     false
        // );

        await ctx.scene.leave();
    }

    @Action('tonkeeper_payment')
    async onTonkeeperPayment(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();

        const method = ctx.scene.state.method;
        const amount = method === 'ton' ? ctx.session.formData.amountInTon : ctx.session.formData.amountInUsd;

        // const memo = await this.paymentService.createDeposit(ctx.from.id.toString());
        // const tonkeeperUrl = this.createTonkeeperUrl(amount, memo, method);

        // const currency = method === 'ton' ? 'TON' : 'USDT';
        // const amountFixed = method === 'ton' ? amount.toFixed(4) : amount.toFixed(2);

        // await this.telegramService.sendOrEditMessage(ctx,
        //     `💰 <b>Платеж через TONkeeper</b>\n\n` +
        //     `📊 Сумма: <code>${amountFixed}</code> ${currency}\n` +
        //     `📱 <b>Для оплаты:</b>\n` +
        //     `1. Нажмите кнопку "Оплатить через TONkeeper"\n` +
        //     `2. Подтвердите транзакцию в кошельке\n` +
        //     `⚠️ <b>Важно:</b> Мемо будет автоматически добавлено в транзакцию`,
        //     [
        //         [{ text: '💳 Оплатить через TONkeeper', url: tonkeeperUrl }]
        //     ],
        //     false
        // );

        await ctx.scene.leave();
    }


    @On('text')
    async onText(@Ctx() ctx: SceneSession) {
        const text = (ctx.message as any)?.text;
        const userId = ctx.from?.id;

        if (!text || !userId) return;

        if (ctx.session.formData.step === 1) {
            // if(isNaN(Number(text))) return;
            // const amountInRub = new Decimal(text);
            let isAmountValid = false;
            let amountInRub = new Decimal(0);

            if(!isNaN(Number(text))){
                amountInRub = new Decimal(text);
                isAmountValid = true;
                if (amountInRub.lessThan(this.minDepositAmountInRub)) {
                    isAmountValid = false;
                }
            }

            if(!isAmountValid) {
                await ctx.reply(
                    `❌ Неверная сумма. Введите положительное число в рублях.\n\nНапример: <code>100</code> или <code>255.5</code>`,
                    {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '⬅️ Отмена', callback_data: 'cancel_deposit' }]
                            ]
                        }
                    }
                );
                return;
            };

           

            ctx.session.formData.amountInRub = amountInRub;


            let amount = new Decimal(0);
            if (ctx.scene.state.method === 'ton') {
                // ctx.session.formData.amountInTon = amountInRub.dividedBy(this.globalConfig.buyTonRateInRub);
                amount = ctx.session.formData.amountInTon;
            } else {
                // ctx.session.formData.amountInUsd = amountInRub.div(this.globalConfig.usdToRubRate)
                amount = ctx.session.formData.amountInUsd;
            }


            ctx.session.formData.step = 2;

            await this.telegramService.sendOrEditMessage(ctx,
                `💰 <b>Депозит через ${this.renderMethodMessage(ctx, true)}</b>\n\n` +
                // `💵 Сумма: ${this.telegramService.showPrice(amountInRub)}\n` +
                `📊 Эквивалент: <code>${amount.toFixed(2)} ${this.renderMethodMessage(ctx)}</code>\n` +
                `${this.renderRateMessage(ctx)}\n\n` +
                `Выберите удобный способ внесения депозита:`,
                [
                    [{ text: '💰 Внести через иной кошелек', callback_data: 'pay_deposit' }],
                    [{ text: '💳 Оплатить через TONkeeper', callback_data: 'tonkeeper_payment' }],
                ],
                true
            );

            return
        }
    }

    @Action('create_new_payment')
    async onCreateNewPayment(@Ctx() ctx: SceneContext) {
        await ctx.scene.reenter();
    }



    // @Action('test_deposit')
    // async onTestDeposit(@Ctx() ctx: SceneContext) {
    //     // await ctx.reply('test_deposit');
    //      await this.telegramService.showDepositSuccess(updatedDeposit);
    // }


    // @Action(/^cancel_deposit_(.+)$/)
    @Action('cancel_deposit')
    async onCancelDeposit(@Ctx() ctx: SceneContext) {
        await ctx.scene.leave();
        await ctx.reply("Пополнение отменено")
        await ctx.answerCbQuery();
    }

}
