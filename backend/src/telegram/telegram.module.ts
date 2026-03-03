import { AdminModule } from '@/admin/admin.module';
import { DatabaseModule } from '@/database/database.module';
import { GiftModule } from '@/gift/gift.module';
import { PaymentModule } from '@/payment/payment.module';
import { UsersModule } from '@/users/users.module';
import { UsersService } from '@/users/users.service';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TelegrafModule } from 'nestjs-telegraf';
import { MemorySessionStore, session } from 'telegraf';
import { BotNewsScene } from './scenes/admin/bot_news.scene';
import { LocalizationService } from './services/localization.service';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { GarantsUpdate } from './updates/garants.update';
import { LanguageUpdate } from './updates/language.update';
import { MainMenuUpdate } from './updates/main-menu.update';
import { TelegramClient } from './updates/TelegramClient';

@Module({

  imports: [
    ConfigModule,
    DatabaseModule,
    JwtModule,
    forwardRef(() => GiftModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => AdminModule),
    forwardRef(() => UsersModule),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, forwardRef(() => UsersModule)],
      useFactory: (configService: ConfigService, usersService: UsersService) => {
        return {
          token: configService.get<string>('BOT_TOKEN'),
          middlewares: [session({
            store: new MemorySessionStore(5 * 60 * 1000)
          }
          )],
          launchOptions: {
            allowedUpdates: [
              'message',
              'chat_member',
              'my_chat_member',
              'chat_join_request',
              'callback_query',
              'inline_query',
              'business_message' as any,
              'edited_business_message',
              'deleted_business_message',
              'sender_business_bot',
              'business_connection',
              "successful_payment",
              "pre_checkout_query",
              "refunded_payment" as any,

            ],
            dropPendingUpdates: true,
          },
        };
      },
      inject: [ConfigService, UsersService],
    }),

  ],
  providers: [
    LanguageUpdate,
    MainMenuUpdate,
    GarantsUpdate,
    LocalizationService,

    // BuyStarsScene,
    // BuyPremiumScene,
    // SellStarsScene,
    // TopUpBalanceScene,

    // DepositTonScene,
    // DepositCryptoBotScene,
    // PlategaDepositScene,
    BotNewsScene,


    TelegramClient,


    TelegramService,
    TelegramUpdate,


  ],
  exports: [TelegramService, LocalizationService, TelegramClient]
})
export class TelegramModule { }
