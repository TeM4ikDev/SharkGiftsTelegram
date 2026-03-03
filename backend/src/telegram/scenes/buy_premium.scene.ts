import { AdminService } from "@/admin/admin.service";
import { ActionParam } from "@/decorators/telegram.decorator";
import { PaymentService } from "@/payment/payment.service";
import { UsersService } from "@/users/users.service";
import { Injectable } from "@nestjs/common";
import { TelegramPremiumMonth } from "@prisma/client";
import { Action, Ctx, On, Scene, SceneEnter } from "nestjs-telegraf";
import { Scenes } from "telegraf";
import { SCENES } from "../constants/telegram.constants";
import { Language } from "../decorators/language.decorator";
import { TelegramService } from "../telegram.service";
import { TelegramClient } from "../updates/TelegramClient";



interface IBuyPremiumFormData {
    step: number;
    premiumMonths?: TelegramPremiumMonth,
    recipientUsername?: string,
    isGift?: boolean
}

type SceneSession = Scenes.SceneContext & {
    session: Scenes.SceneSessionData & {
        formData: IBuyPremiumFormData;
        language?: string;
    }
};

@Injectable()
@Scene(SCENES.BUY_PREMIUM)
export class BuyPremiumScene {
    private globalConfig = null
    private language = 'ru'

    constructor(
        private telegramService: TelegramService,
        private usersService: UsersService,
        private readonly adminService: AdminService,
        private readonly paymentService: PaymentService,
        private readonly telegramClient: TelegramClient,
        ) { }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: SceneSession, @Language() scene_lang: string) {
        this.globalConfig = this.telegramService.getGlobalConfig()
        this.language = scene_lang;
        
        await this.telegramService.sendOrEditMessage(ctx,
            '✨ Выбор получателя\n\nВыберите, кому вы хотите купить Telegram Premium',
            [[
                { text: '👤 Купить себе', callback_data: 'buy_premium_self' },
                { text: '🎁 Подарить другу', callback_data: 'buy_premium_gift' }
            ]]
        );

        ctx.session.formData = {
            step: 0, isGift: false
        };
    }

    @Action("buy_premium_self")
    async onBuySelf(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();


        if(ctx.from.is_premium){
            await ctx.reply('❌ Вы уже имеете Telegram Premium.', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '❌ Отменить', callback_data: 'cancel_purchase' }]
                    ]
                }
            });
            return;
        }

        await this.onSelectMonths(ctx, ctx.from.username, false);
    }

    @Action("buy_premium_gift")
    async onBuyGift(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await this.telegramService.sendOrEditMessage(ctx,
            `👤 Введите @username пользователя, которому вы хотите подарить Telegram Premium:`,
        );

        ctx.session.formData = {
            step: 1,
            isGift: true
        };
    }

    private async onSelectMonths(@Ctx() ctx: SceneSession, recipientUsername: string, isGift: boolean) {
        const price3 = this.globalConfig.premiumPrice3Months;
        const price6 = this.globalConfig.premiumPrice6Months;
        const price12 = this.globalConfig.premiumPrice12Months;

        await this.telegramService.sendOrEditMessage(ctx,
            `👤 Получатель: @${recipientUsername}\n\n✨ Выберите срок подписки Telegram Premium:`,
            [
                [
                    { text: `3 месяца - ${this.telegramService.showPrice(price3, false)}`, callback_data: 'premium_months_3' },
                ],
                [
                    { text: `6 месяцев - ${this.telegramService.showPrice(price6, false)}`, callback_data: 'premium_months_6' },
                ],
                [
                    { text: `12 месяцев - ${this.telegramService.showPrice(price12, false)}`, callback_data: 'premium_months_12' },
                ],
                [
                    { text: '❌ Отменить', callback_data: 'cancel_purchase' }
                ]
            ],
            false
        );

        ctx.session.formData.step = 2;
        ctx.session.formData.recipientUsername = recipientUsername;
        ctx.session.formData.isGift = isGift;
    }


    @On('text')
    async onText(@Ctx() ctx: SceneSession) {
        if (ctx.session.formData.step === 1) {
            const text: string = (ctx.message as any)?.text;
            if (!text) return;

            const username = text.trim().replace("@", "");
            const isGift = ctx.session.formData.isGift || false;


            const userData = await this.telegramClient.getUserData(username);
            if (!userData) {
                await ctx.reply('❌ Пользователь не найден. Возможно это группа или канал.');
                return;
            }
            if (userData.premium) {
                await ctx.reply('❌ Пользователь уже имеет Telegram Premium.', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '❌ Отменить', callback_data: 'cancel_purchase' }]
                        ]
                    }
                });
                return;
            }

            await this.onSelectMonths(ctx, userData.username, isGift);
            return
        }
    }

    @Action('premium_months_3')
    async onSelect3Months(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await this.onConfirmPremium(ctx, 'MONTHS_3' as TelegramPremiumMonth);
    }

    @Action('premium_months_6')
    async onSelect6Months(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await this.onConfirmPremium(ctx, 'MONTHS_6' as TelegramPremiumMonth);
    }

    @Action('premium_months_12')
    async onSelect12Months(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await this.onConfirmPremium(ctx, 'MONTHS_12' as TelegramPremiumMonth);
    }

    private async onConfirmPremium(@Ctx() ctx: SceneSession, premiumType: TelegramPremiumMonth) {
        const user = await this.usersService.findUserByTelegramId(String(ctx.from.id));
        if (!user) {
            await ctx.reply('❌ Пользователь не найден');
            return;
        }

        let priceInRub;
        let monthsText;
        switch (premiumType) {
            case 'MONTHS_3':
                priceInRub = this.globalConfig.premiumPrice3Months;
                monthsText = '3 месяца';
                break;
            case 'MONTHS_6':
                priceInRub = this.globalConfig.premiumPrice6Months;
                monthsText = '6 месяцев';
                break;
            case 'MONTHS_12':
                priceInRub = this.globalConfig.premiumPrice12Months;
                monthsText = '12 месяцев';
                break;
        }

        const balance = user.balance;

        if (balance.lessThan(priceInRub)) {
            await this.telegramService.sendOrEditMessage(ctx,
                `❌ Недостаточно средств!\n\n💰 Ваш баланс: ${this.telegramService.showPrice(balance)}\n💵 Требуется: ${this.telegramService.showPrice(priceInRub)}\n\n💡 Пополните баланс для продолжения`,
                [
                    [{ text: '💳 Пополнить баланс', callback_data: 'top_up_balance' }],
                    [{ text: '❌ Отменить', callback_data: 'cancel_purchase' }]
                ],
                false
            );
            return;
        }

        ctx.session.formData.premiumMonths = premiumType;
        ctx.session.formData.step = 3;

        await this.telegramService.sendOrEditMessage(ctx,
            `✅ Подтверждение покупки\n\n👤 Получатель: @${ctx.session.formData.recipientUsername}\n✨ Срок подписки: ${monthsText}\n💰 Стоимость: ${this.telegramService.showPrice(priceInRub)}\n\nПодтвердите покупку:`,
            [[
                { text: '✅ Подтвердить', callback_data: 'confirm_purchase' },
                { text: '❌ Отменить', callback_data: 'cancel_purchase' }
            ]],
            false
        );
    }

    @Action('confirm_purchase')
    async onConfirmPurchase(@Ctx() ctx: SceneSession, @ActionParam(0) exportChatId: string) {
        await ctx.answerCbQuery();
        const formData = ctx.session.formData;

        if (!formData.premiumMonths) {
            await ctx.reply('❌ Ошибка: данные покупки не найдены');
            return;
        }

        const user = await this.usersService.findUserByTelegramId(String(ctx.from.id));
        if (!user) {
            await ctx.reply('❌ Пользователь не найден');
            return;
        }

        let priceInRub;
        let monthsText;
        switch (formData.premiumMonths) {
            case 'MONTHS_3':
                priceInRub = this.globalConfig.premiumPrice3Months;
                monthsText = '3 месяца';
                break;
            case 'MONTHS_6':
                priceInRub = this.globalConfig.premiumPrice6Months;
                monthsText = '6 месяцев';
                break;
            case 'MONTHS_12':
                priceInRub = this.globalConfig.premiumPrice12Months;
                monthsText = '12 месяцев';
                break;
        }

        const balance = user.balance;

        if (balance.lessThan(priceInRub)) {
            await ctx.reply('❌ Недостаточно средств на балансе');
            return;
        }

        await this.telegramService.sendOrEditMessage(ctx,
            `⏳ Ожидайте покупку...\n\n👤 Получатель: @${formData.recipientUsername}\n✨ Срок подписки: ${monthsText}\n💰 Стоимость: ${this.telegramService.showPrice(priceInRub)}`,
            [],
            false
        );

        try {
            const purchase = null;
            //  await this.paymentService.createPurchase(
            //     user.telegramId, 
            //     formData.recipientUsername, 
            //     formData.isGift || false, 
            //     formData.premiumMonths, 
            //     priceInRub, 
            //     'PREMIUM'
            // );

            if (purchase && purchase.status === 'COMPLETED') {
                // Получаем актуальный баланс после покупки
                const updatedUser = await this.usersService.findUserByTelegramId(String(ctx.from.id));
                await this.telegramService.sendOrEditMessage(ctx,
                    `✅ Покупка успешно завершена!\n\n👤 Получатель: @${formData.recipientUsername}\n✨ Срок подписки: ${monthsText}\n💰 Потрачено: ${this.telegramService.showPrice(priceInRub)}\n\n💳 Остаток на балансе: ${this.telegramService.showPrice(updatedUser?.balance || balance.minus(priceInRub))}`,
                    [],
                    false
                );

                await ctx.reply('💬 Вы можете оставите свой отзыв о нашем сервисе тут 👉', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'ОСТАВИТЬ ОТЗЫВ', url: 'https://t.me/clashstars_reviews' }]
                        ]
                    }
                });
            } else {
                await ctx.reply('❌ Произошла ошибка при обработке покупки. Баланс будет возвращен. Попробуйте позже.');
            }
            await ctx.scene.leave();
        } catch (error) {
            console.error('Error processing purchase:', error);
            await ctx.reply('❌ Произошла ошибка при обработке покупки. Баланс будет возвращен. Попробуйте позже.');
            await ctx.scene.leave();
        }
    }

    @Action('cancel_purchase')
    async onCancelPurchase(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await ctx.scene.leave()
        await ctx.reply("Покупка отменена!")
    }
}