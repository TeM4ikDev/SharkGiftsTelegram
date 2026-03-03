import { AdminService } from '@/admin/admin.service';
import { DatabaseService } from '@/database/database.service';
import { PaymentService } from '@/payment/payment.service';
import { IGlobalConfig, IUser } from '@/types/types';
import { UsersService } from '@/users/users.service';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Input, Telegraf } from 'telegraf';
import { InlineKeyboardButton, InputFile, InputMediaPhoto, InputMediaVideo } from 'telegraf/typings/core/types/typegram';
import { BASE_BOT_IMAGE } from './constants/telegram.constants';
import { LocalizationService } from './services/localization.service';


@Injectable()
export class TelegramService {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    @Inject('DEFAULT_BOT_NAME') private readonly botName: string,
    
    @Inject(forwardRef(() => UsersService))
    private readonly database: DatabaseService,
    private readonly configService: ConfigService,
    private readonly localizationService: LocalizationService,
    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) { }

  private logger: Logger = new Logger(TelegramService.name);
  private mainGroupName: string = this.configService.get<string>('MAIN_GROUP_NAME')
  private scamFormsChannel = this.configService.get<string>('SCAM_FORMS_CHANNEL')
  private allowedStatuses = new Set(['creator', 'administrator', 'member']);



  private globalConfig: Prisma.GlobalConfigGetPayload<{}> = null



  async onModuleInit() {
    this.globalConfig = await this.adminService.getGlobalConfig()

    // const transactions = await this.getStarsHistory();
    // console.log(transactions);

    // setTimeout(async () => {
    //   await this.refundStars(2027571609, "stxuW90BzIg3tB1SIWDwI6cf4jWfhAy13w-x-1YtDZXmhwn01fKxrU5pQaentjQKw_t6BlDdDn5pBCWyzy7AjJG-JutjGPj0zHqR6nNYutMFsWi6G_JANkr39B8QwfooCFj");
    // }, 10000);

  }


  setGlobalConfig(conf: any) {
    this.globalConfig = conf
  }

  getGlobalConfig() {
    return this.globalConfig
  }


  async getNotSubscribedChannels(telegramId: string, channels: string[]): Promise<string[]> {
    if (!telegramId || channels.length === 0) {
        return channels;
    }
    const results = await Promise.all(
        channels.map(async (channel) => {
            try {
                const member = await this.bot.telegram.getChatMember(`@${channel}`, Number(telegramId));

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



  showPrice(priceInRub: Decimal, useMarkdown: boolean = true, useUsd: boolean = true): string {
    // const text = `${priceInRub.toFixed(2)}₽ (${(priceInRub.div(useUsd ? this.globalConfig.usdToRubRate : this.globalConfig.buyTonRateInRub)).toFixed(2)}${useUsd ? '$' : 'TON'})`
    // return useMarkdown ?
    //   `<code>${text}</code>` :
    //   text

    return priceInRub.toFixed(2)
  }

  async sendOrEditMessage(ctx: Context, message: string, keyboard: InlineKeyboardButton[][] = [], showBackKeyboard: boolean = true, backAction?: string) {
    try {
      const isScene = (ctx as any).scene?.current;
      // const finalBackAction = backAction || (isScene ? 'scene_back' : 'back_to_main');

      const reply_markup = {
        inline_keyboard: [
          ...keyboard,

          ...(showBackKeyboard ? [
            [{ text: '◀️ Назад', callback_data: "back_to_main" }]
          ] : [])
        ]
      }

      if (ctx.callbackQuery?.message?.message_id) {
        try {
          await ctx.editMessageCaption(message, {
            parse_mode: 'HTML',
            reply_markup
          });
        } catch (error: any) {
          console.log(error)
          await ctx.answerCbQuery();
        }
      } else {
        await ctx.replyWithPhoto(BASE_BOT_IMAGE, {
          caption: message,
          parse_mode: 'HTML',
          reply_markup
        });
      }
    } catch (error: any) {
      console.log(error)
    }
  }


  async checkStartPayload(ctx: Context, isUserNew: boolean): Promise<boolean> {
    const startPayload = (ctx as any).startPayload
    if (!startPayload) return false

    const command = startPayload.split('_')[0]
    const commandData: string = startPayload.split('_')[1]

    console.log("checkStartPayload")
    switch (command) {

      case 'ref':
        console.log(commandData)
        if (commandData == String(ctx.from.id) || !isUserNew) {
          this.logger.warn("checkStartPayload: user cannot invite himself or is not new")
          return false
        }
        // await this.usersService.makeUserReferral(String(ctx.from.id), commandData)
        return true
      default:
        return false
    }
  }

  async checkIsChatPrivate(ctx: Context): Promise<boolean> {
    return ctx.message.chat.type === 'private'
  }

  async uploadFilesGroup(files: any[]): Promise<Array<{ type: string; file_id: string }>> {
    const media = files.map((file) => {
      const isVideo = file.mimetype?.startsWith('video/');

      if (isVideo) {
        return {
          type: 'video' as const,
          media: Input.fromBuffer(file.buffer, file.originalname || 'video.mp4')
        } as InputMediaVideo;
      } else {
        return {
          type: 'photo' as const,
          media: Input.fromBuffer(file.buffer, file.originalname || 'image.jpg')
        } as InputMediaPhoto;
      }
    });

    const sent = await this.bot.telegram.sendMediaGroup('@imagesbase', media);

    const fileIds: Array<{ type: string; file_id: string }> = sent.map(
      (msg) => {
        if ('photo' in msg && msg.photo && msg.photo.length > 0) {
          return {
            type: 'photo',
            file_id: msg.photo[msg.photo.length - 1].file_id
          };
        }
        if ('video' in msg && msg.video) {
          return {
            type: 'video',
            file_id: msg.video.file_id
          };
        }
        return null;
      }
    ).filter((item): item is { type: string; file_id: string } => item !== null);

    return fileIds;
  }

  getPhotoStream(filePath: string): InputFile {
    return Input.fromLocalFile(filePath)
  }

  async sendMessage(telegramId: string, message: string, options?: any) {
    return await this.bot.telegram.sendMessage(telegramId, message, options)
  }

  async sendMessageByUserId(userId: string, message: string, options?: any) {
    const user = await this.usersService.findUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    return await this.sendMessage(user.telegramId, message, options)
  }

  async sendMessageToUsers(telegramIds: string[], message: string, options?: any) {
    for (const telegramId of telegramIds) {
      await this.bot.telegram.sendMessage(telegramId, message, options)
    }
  }

  async replyWithAutoDelete(ctx: Context, text: string, options?: any, deleteAfterMs: number = 15000) {
    const message = await ctx.reply(text, {
      parse_mode: 'HTML',
      link_preview_options: {
        is_disabled: true,
      },
      ...options
    });

    // if (await this.checkIsChatPrivate(ctx)) return

    setTimeout(async () => {
      try {
        await ctx.deleteMessage(message.message_id);
        if (ctx?.message?.message_id) await ctx.deleteMessage(ctx.message.message_id);
      } catch (error: any) {
        console.log('Не удалось удалить сообщение:', error.message);
      }
    }, deleteAfterMs);

    return message;
  }

  async replyMediaWithAutoDelete(ctx: Context, source: InputFile | string, options: any, mediaType: 'photo' | 'video', deleteAfterMs: number = 60000, isDisable: boolean = true) {

    const message = mediaType === 'photo' ?
      await ctx.replyWithPhoto(source, {
        parse_mode: "HTML",
        link_preview_options: {
          is_disabled: true,
        }, ...options
      })
      : await ctx.replyWithVideo(source, {
        parse_mode: "HTML",
        link_preview_options: {
          is_disabled: true,
        }, ...options
      });

    // if (await this.checkIsChatPrivate(ctx)) return

    if (await this.checkIsChatPrivate(ctx)) {
      return
    }

    // if (isDisable) {
    //   return
    // }

    setTimeout(async () => {
      try {
        await ctx.deleteMessage(message.message_id);
        if (ctx?.message?.message_id) await ctx.deleteMessage(ctx.message.message_id);
      } catch (error: any) {
        console.log('Не удалось удалить сообщение:', error.message);
      }
    }, deleteAfterMs);
  }


  async showDepositSuccess(user: IUser, amountInStars: Decimal) {
    return this.bot.telegram.sendMessage(user.telegramId, `✅ <b>Ваш баланс пополнен на ${amountInStars.toFixed(2)} ⭐</b>`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Просмотр профиля', web_app: { url: `https://gamepablo.com/profile` } }]
        ]
      }
    })
  }

  async sendMessageToChannelLayer(channelId: string, message: string, options?: any) {
    try {
      return await this.bot.telegram.sendMessage(channelId, message, options)
    } catch (error: any) {
      console.log('Не удалось отправить сообщение:', error.message);
      return null;
    }
  }

  async forwardMessage(channelId: string, fromChatId: string, messageId: number) {
    return await this.bot.telegram.forwardMessage(channelId, fromChatId, messageId)
  }

  async forwardMessageToChannel(channelId: string, fromChatId: string, messageId: number) {
    return await this.bot.telegram.forwardMessage(channelId, fromChatId, messageId)
  }

  async sendMediaGroupToChannel(channelId: string, mediaGroup: any[]) {
    return await this.bot.telegram.sendMediaGroup(channelId, mediaGroup)
  }

  isUserHasAccept(telegramId: string, arrAccepted: string[]): boolean {
    return arrAccepted.includes(telegramId)
  }

  testIsUsername(username: string): boolean {
    const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/;
    return USERNAME_REGEX.test(username.replace('@', ''));
  }

  testIsTelegramId(telegramId: string): boolean {
    return /^\d+$/.test(telegramId.toString());
  }


  async getStarsHistory(limit = 100, offset = 0) {
    try {
      // Вызов нативного метода Telegram API через Telegraf
      const transactions = await this.bot.telegram.callApi('getStarTransactions' as any, {
        offset: offset,
        limit: limit,

      } as any);

      return transactions.transactions;
    } catch (error) {
      console.error('Ошибка при получении транзакций:', error);
      throw error;
    }
  }

  async refundStars(userId: number, transactionId: string) {
    // Этот метод возвращает звезды пользователю
    return await this.bot.telegram.callApi('refundStarPayment' as any, {
      user_id: userId,
      telegram_payment_charge_id: transactionId,
    });
  }


  


}