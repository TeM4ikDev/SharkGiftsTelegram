import { AdminService } from "@/admin/admin.service";
import { ActionParam } from "@/decorators/telegram.decorator";
import { PaymentService } from "@/payment/payment.service";
import { UsersService } from "@/users/users.service";
import { Injectable } from "@nestjs/common";
import { Action, Ctx, On, Scene, SceneEnter } from "nestjs-telegraf";
import { Scenes } from "telegraf";
import { SCENES } from "../constants/telegram.constants";
import { Language } from "../decorators/language.decorator";
import { TelegramService } from "../telegram.service";
import { TelegramClient } from "../updates/TelegramClient";



interface IBuyStarsFormData {
    step: number;
    starsAmount?: number,
    recipientUsername?: string,
    isGift?: boolean
}

type SceneSession = Scenes.SceneContext & {
    session: Scenes.SceneSessionData & {
        formData: IBuyStarsFormData;
        language?: string;
    }
};

@Injectable()
@Scene(SCENES.BUY_STARS)
export class BuyStarsScene {
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
        console.log(this.globalConfig)

        this.globalConfig = this.telegramService.getGlobalConfig()


        const user = await this.usersService.findUserByTelegramId(String(ctx.from.id));
        

        this.language = scene_lang;
        await this.telegramService.sendOrEditMessage(ctx,
            `✨ Выбор имени пользователя\n\nВыберите, кому вы хотите купить Telegram Stars\n\n💰 Ваш баланс: ${this.telegramService.showPrice(user.balance)}`,
            [[
                { text: '👤 Купить себе', callback_data: 'buy_stars_self' },
                { text: '🎁 Подарить другу', callback_data: 'buy_stars_gift' }
            ]]
        );

        ctx.session.formData = {
            step: 0, isGift: false
        };
    }

    @Action("buy_stars_self")
    async onBuy(@Ctx() ctx: SceneSession, recipientUsername?: string) {
        // await ctx.answerCbQuery();
        await this.telegramService.sendOrEditMessage(ctx,
            `👤 Получатель: @${recipientUsername || ctx.from.username}\n\n💫 Введите количество звезд, которое хотите купить:\n\n📌 Минимальная сумма покупки - от ${this.globalConfig.minStarsToBuy} звёзд`,
        );

        ctx.session.formData.step = 2;
        ctx.session.formData.recipientUsername = recipientUsername || ctx.from.username;
    }

    @Action("buy_stars_gift")
    async onBuyGift(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await this.telegramService.sendOrEditMessage(ctx,
            `👤 Введите @username пользователя, которому вы хотите подарить Telegram Stars:`,
        );

        ctx.session.formData = {
            step: 1,
            isGift: true
        };
    }


    @On('text')
    async onText(@Ctx() ctx: SceneSession) {
        if (ctx.session.formData.step === 1) {
            const text: string = (ctx.message as any)?.text;
            console.log(text, 'text')
            if (!text) return;

            const username = text.trim().replace("@", "");

            console.log(username, 'username')


            const userData = await this.telegramClient.getUserData(username);

            console.log(userData, 'userData')
            if (!userData) {
                await ctx.reply('❌ Пользователь не найден. Возможно это группа или канал.');
                return;
            }

            await this.onBuy(ctx, username)
            return
        }

        if (ctx.session.formData.step === 2) {
            const text: string = (ctx.message as any)?.text;

            if (!text){
                await ctx.reply('❌ Неверный формат. Введите @username пользователя.');
                return;
            };
            const starsAmount = parseInt(text.trim());

            if (isNaN(starsAmount) || starsAmount < this.globalConfig.minStarsToBuy) {
                await this.telegramService.sendOrEditMessage(ctx,
                    `❌ Ошибка!\n\nВведите корректное количество звезд.\n📌 Минимальная сумма покупки - ${this.globalConfig.minStarsToBuy} звёзд`,
                    [
                        [{ text: '❌ Отменить', callback_data: 'cancel_purchase' }]
                    ],
                    false
                );
                return;
            }

            const user = await this.usersService.findUserByTelegramId(String(ctx.from.id));
            if (!user) {
                await ctx.reply('❌ Пользователь не найден');
                return;
            }

            const balance = user.balance;
            const totalCostInRub = this.globalConfig.buyStarsRateInRub.mul(starsAmount);
            console.log(balance, totalCostInRub)

            if (balance.lessThan(totalCostInRub)) {
                await this.telegramService.sendOrEditMessage(ctx,
                    `❌ Недостаточно средств!\n\n💰 Ваш баланс: ${this.telegramService.showPrice(balance)}\n💵 Требуется: ${this.telegramService.showPrice(totalCostInRub)}\n\n💡 Пополните баланс для продолжения или измените количество товара`,
                    [
                        [{ text: '💳 Пополнить баланс', callback_data: 'top_up_balance' }],
                    ]
                );
                return;
            }

            ctx.session.formData.starsAmount = starsAmount;
            ctx.session.formData.step = 3;

            await this.telegramService.sendOrEditMessage(ctx,
                `✅ Подтверждение покупки\n\n👤 Получатель: @${ctx.session.formData.recipientUsername}\n💫 Количество звезд: <code>${starsAmount}</code>\n⭐️ Цена за звезду: ${this.telegramService.showPrice(this.globalConfig.buyStarsRateInRub)}\n💰 Стоимость: ${this.telegramService.showPrice(totalCostInRub)}\n\nПодтвердите покупку:`,
                [[
                    { text: '✅ Подтвердить', callback_data: 'confirm_purchase' },
                    { text: '❌ Отменить', callback_data: 'cancel_purchase' }
                ]],
                false
            );
        }
    }

    @Action('confirm_purchase')
    async onConfirmPurchase(@Ctx() ctx: SceneSession, @ActionParam(0) exportChatId: string) {
        await ctx.answerCbQuery();
        const formData = ctx.session.formData;
        console.log(formData)

        // return

        if (!formData.starsAmount) {
            await ctx.reply('❌ Ошибка: данные покупки не найдены');
            return;
        }

        const user = await this.usersService.findUserByTelegramId(String(ctx.from.id));
        if (!user) {
            await ctx.reply('❌ Пользователь не найден');
            return;
        }

        const balance = user.balance;
        const totalCostInRub = this.globalConfig.buyStarsRateInRub.mul(formData.starsAmount);

        console.log(balance, totalCostInRub)

        if (balance.lessThan(totalCostInRub)) {
            await ctx.reply('❌ Недостаточно средств на балансе');
            return;
        }

        await this.telegramService.sendOrEditMessage(ctx,
            `Ожидайте покупку...\n\n👤 Получатель: @${formData.recipientUsername}\n💫 Количество звезд: ${formData.starsAmount}\nЦена за звезду: ${this.telegramService.showPrice(this.globalConfig.buyStarsRateInRub)}\n💰 Стоимость: ${this.telegramService.showPrice(totalCostInRub)}`,
            [],
            false
        );

        // const serviceProfit = this.telegramService.calcServiceProfit('buyStarsRateInUsd', formData.starsAmount, false);
        // console.log(serviceProfit)
        // return

        try {
            // const purchase = await this.paymentService.createPurchase(user.telegramId, formData.recipientUsername, formData.isGift || false, formData.starsAmount, totalCostInRub, 'STARS');
            const purchase = null;
            if (purchase && purchase.status === 'COMPLETED') {
                await this.telegramService.sendOrEditMessage(ctx,
                    `✅ Покупка успешно завершена!\n\n👤 Получатель: @${formData.recipientUsername}\n 💫 Куплено звезд: ${formData.starsAmount} ⭐\n💰 Потрачено: ${this.telegramService.showPrice(totalCostInRub)}\n\n💳 Остаток на балансе: ${this.telegramService.showPrice(balance.minus(totalCostInRub))} ₽`,
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
                await ctx.reply('❌ Произошла ошибка при обработке покупки. Попробуйте позже. Ваш баланс возвращен.');
            }
            await ctx.scene.leave();
        } catch (error) {
            console.error('Error processing purchase:', error);
            await ctx.reply('❌ Произошла ошибка при обработке покупки. Попробуйте позже. Ваш баланс возвращен.');
            ctx.scene.leave();
        }
    }

    @Action('cancel_purchase')
    async onCancelPurchase(@Ctx() ctx: SceneSession) {
        await ctx.answerCbQuery();
        await ctx.scene.leave()
        await ctx.reply("Покупка отменена!")
    }
}