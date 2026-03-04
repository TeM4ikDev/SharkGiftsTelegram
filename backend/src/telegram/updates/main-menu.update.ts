import { AdminService } from '@/admin/admin.service';
import { UsersService } from '@/users/users.service';
import { ConfigService } from '@nestjs/config';
import { UserRoles } from '@prisma/client';
import { NextFunction } from 'express';
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { SCENES } from '../constants/telegram.constants';
import { Language } from '../decorators/language.decorator';
import { LocalizationService } from '../services/localization.service';
import { TelegramService } from '../telegram.service';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

type InlineKeyboardButtonWithIcon = InlineKeyboardButton & { icon_custom_emoji_id?: string, style?: 'primary' | 'success' | 'danger' };



// @UseGuards(UserCheckMiddleware)
@Update()
export class MainMenuUpdate {

    private allowedStatuses = new Set(['creator', 'administrator', 'member']);
    private botUsername = this.configService.get('BOT_USERNAME');

    constructor(
        protected readonly telegramService: TelegramService,
        protected readonly configService: ConfigService,
        protected readonly userService: UsersService,
        private readonly localizationService: LocalizationService,
        private readonly adminService: AdminService,
    ) { }

    private getChannelsFromConfig(globalConfig: any): string[] {
        if (!globalConfig?.channelsToSubscribe) {
            return [];
        }

        const channels = globalConfig.channelsToSubscribe;
        if (Array.isArray(channels)) {
            // Убираем @ из начала, если есть
            return channels.map((channel: string) =>
                channel.startsWith('@') ? channel.slice(1) : channel
            );
        }

        return [];
    }

    createChannelsKeyboard(channels: string[]) {
        if (channels.length === 0) {
            return [[{ text: '✅ Готово', callback_data: 'channels_done' }]];
        }

        const rows = channels.map((channel, index) => [
            { text: `Подписка ${index + 1}`, url: `https://t.me/${channel}` },
        ]);

        return [...rows, [{ text: '✅ Готово', callback_data: 'channels_done' }]];
    }


    private async getNotSubscribedChannels(ctx: Context, channels: string[]): Promise<string[]> {
        if (!ctx.from || channels.length === 0) {
            return channels;
        }

        const results = await Promise.all(
            channels.map(async (channel) => {
                try {
                    const member = await ctx.telegram.getChatMember(`@${channel}`, ctx.from!.id);

                    console.log(member)

                    if (member.status === 'restricted') {
                        return 'is_member' in member && member.is_member ? null : channel;
                    }

                    return this.allowedStatuses.has(member.status) ? null : channel;
                } catch (error) {
                    console.warn(`Не удалось проверить подписку на канал ${channel}`, error);
                    return channel;
                }
            }),
        );

        return results.filter((channel): channel is string => Boolean(channel));
    }

    async exitSceneOnCommandMiddleware(ctx: Context, next: NextFunction) {
        const sceneContext = ctx as any;



        // console.log(sceneContext, 'sceneContext')
        // // Проверяем, находится ли пользователь в сцене
        // if (!sceneContext.scene) {
        //   return next();
        // }

        // Проверяем, является ли это командой, через структуру update
        // let isCommand = false;

        // Получаем текст сообщения из разных источников
        let messageText: string | undefined = sceneContext.update.message?.text;

        if (messageText && messageText.startsWith('/start')) {
            // isCommand = true;


            // console.log(isCommand, 'isCommand')
            // console.log(`[ExitSceneMiddleware] User ${ctx.from?.id} used command, leaving scene`);

            try {
                await sceneContext.scene.leave();
                await this.onStart(ctx);
            } catch (error) {
                console.error('[ExitSceneMiddleware] Error leaving scene:', error);
            }
        }


        // if (isCommand) {
        //   // Если пользователь находится в сцене и использует команду, выходим из сцены
        //   try {
        //     console.log(`[ExitSceneMiddleware] User ${ctx.from?.id} used command, leaving scene: ${sceneContext.scene.current}`);
        //     await sceneContext.scene.leave();
        //   } catch (error) {
        //     console.error('[ExitSceneMiddleware] Error leaving scene:', error);
        //   }
        // }

        // Продолжаем обработку
        return next();
    };

    @Start()
    async onStart(@Ctx() ctx: Context, @Language() language?: string) {
        const {user, isNew} = await this.userService.findOrCreateUser((ctx.from));
        console.log(user, isNew, 'user, isNew')

        await this.telegramService.checkStartPayload(ctx, isNew)

        const globalConfig = this.telegramService.getGlobalConfig();
        const channels = globalConfig?.channelsToSubscribe as string[] || [];

        if (Array.isArray(channels) && channels.length > 0) {
            const notSubscribed = await this.getNotSubscribedChannels(ctx, channels);
            console.log(notSubscribed, 'notSubscribed')

            if (notSubscribed.length > 0) {
                const list = notSubscribed
                    .map((channel, index) => `${index + 1}. @${channel}`)
                    .join('\n');

                this.telegramService.sendOrEditMessage(
                    ctx,
                    `📢 Для использования ботом необходимо подписаться на каналы:\n\n${list}\n\nПодпишитесь на все каналы и нажмите "✅ Готово"`,
                    this.createChannelsKeyboard(notSubscribed),
                    false
                );
                return;
            }
        }
        const hasUserRights = user.role === UserRoles.SUPER_ADMIN || user.role === UserRoles.ADMIN;
        const welcomeMessage = `<tg-emoji emoji-id="5767288471685171967">🤪</tg-emoji> 🦈 Добро пожаловать в Shark Market!`+
`Здесь ты можешь купить гифты, которые уже сняты с продажи — редкие и недоступные в официальных источниках.\n`+
`Выбирай, смотри ассортимент и забирай эксклюзив`


        const mainMenuKeyboard: InlineKeyboardButtonWithIcon[][] = [
            [{
                text: "В магазин",
                web_app: { url: "https://tem4ik.ru/" },
                icon_custom_emoji_id: "5816683056605436129", 
                style: 'success'
            } as any],

            // [
            //     {
            //         text: "Новостной канал",
            //         url: "https://t.me/news_pablo",
            //         icon_custom_emoji_id: "5264896706733951437",
            //         style: "danger" 
            //     }
            // ],
            // [
            //     {
            //         text: "Поддержка",
            //         url: "https://t.me/help_pablo",
            //         icon_custom_emoji_id: "5267017905182097810",
            //         style: "primary"
            //     }
            // ],

            ...(hasUserRights ? [
                [{ text: '📰 Менеджер новостей', callback_data: 'bot_news' }],
            ] : []),
        ]


        await this.telegramService.sendOrEditMessage(
            ctx,
            welcomeMessage,
            mainMenuKeyboard,
            false
        );
    }


    @Action('channels_done')
    async onChannelsDone(@Ctx() ctx: Context, @Language() language?: string) {
        await ctx.answerCbQuery();

        const globalConfig = await this.adminService.getGlobalConfig();
        const channels = this.getChannelsFromConfig(globalConfig);

        if (channels.length === 0) {
            await this.onStart(ctx, language);
            return;
        }

        const notSubscribed = await this.getNotSubscribedChannels(ctx, channels);

        if (notSubscribed.length) {
            const list = notSubscribed
                .map((channel, index) => `${index + 1}. @${channel}`)
                .join('\n');

            this.telegramService.sendOrEditMessage(
                ctx,
                `❌ Необходимо подписаться на каналы:\n\n${list}\n\nПодпишитесь на все каналы и нажмите "✅ Готово" ещё раз.`,
                this.createChannelsKeyboard(notSubscribed),
                false
            );
            return;
        }

        await this.onStart(ctx, language);
    }

    @Action('buy_stars')
    async onBuyStars(@Ctx() ctx: SceneContext) {
        await ctx.answerCbQuery();
        ctx.scene.enter(SCENES.BUY_STARS)
    }

    @Action('sell_stars')
    async onSellStars(@Ctx() ctx: SceneContext) {
        await ctx.answerCbQuery();
        ctx.scene.enter(SCENES.SELL_STARS)
    }

    @Action('buy_premium')
    async onBuyPremium(@Ctx() ctx: SceneContext) {
        await ctx.answerCbQuery();
        ctx.scene.enter(SCENES.BUY_PREMIUM)
    }

    @Action('buy_ton')
    async onBuyTon(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();

        await ctx.reply('💎 Покупка TON\n\nФункционал в разработке', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🔙 Назад', callback_data: 'back_to_main' }
                    ]
                ]
            }
        });
    }


    @Action('top_up_balance')
    async onTopUpBalance(@Ctx() ctx: SceneContext) {
        await ctx.answerCbQuery();
        ctx.scene.enter(SCENES.TOP_UP_BALANCE)
    }

    @Action('bot_news')
    async onBotNews(@Ctx() ctx: SceneContext) {
        await ctx.scene.enter(SCENES.NEWS)
        await ctx.answerCbQuery();
    }

   

    // @Action('back_to_main')
    // async onBackToMain(@Ctx() ctx: Context | SceneContext, @Language() language: string) {
    //     if ('callback_query' in ctx && ctx.callbackQuery?.id) {
    //         await ctx.answerCbQuery();
    //     }

    //     // Если пользователь находится в сцене, выходим из нее
    //     if ('scene' in ctx && ctx.scene) {
    //         await ctx.scene.leave();
    //     }

    //     if ('callback_query' in ctx && ctx.callbackQuery?.message?.message_id) {
    //         try {
    //             await ctx.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
    //         } catch (e) { }
    //     }

    //     await this.onStart(ctx, language)
    // }



    @Action('back_to_main')
    async onBackToMain(@Ctx() ctx: Context, @Language() language: string) {
        console.log((ctx as any).update.callback_query)
        await ctx.answerCbQuery();
        await (ctx as any).scene.leave();
        await this.onStart(ctx, language);
    }

    @Action('scene_back')
    async onSceneBack(@Ctx() ctx: Context, @Language() language: string) {
        await ctx.answerCbQuery();
        const scene = (ctx as any).scene;
        const session = (ctx as any).session;

        if (scene?.current) {
            if (session?.formData?.step > 1) {
                session.formData.step--;
                await scene.reenter();
            } else {
                await scene.leave();
                await this.onStart(ctx, language);
            }
        } else {
            await this.onStart(ctx, language);
        }
    }

    @Command('info')
    @Action('info')
    async onInfo(@Ctx() ctx: Context, @Language() language?: string) {
        if ('callback_query' in ctx) {
            await ctx.answerCbQuery();
        }

        const infoText = `<b>ℹ️ Информация</b>\n\n` +
            `Для ознакомления с правилами сервиса воспользуйтесь ссылками ниже:\n\n` +
            `🔹 <a href="https://telegra.ph/Politika-konfidencialnosti-08-15-17">Политика конфиденциальности</a>\n` +
            `🔹 <a href="https://telegra.ph/Polzovatelskoe-soglashenie-08-15-10">Пользовательское соглашение</a>`;

        await this.telegramService.sendOrEditMessage(
            ctx,
            infoText
        );
    }
}
