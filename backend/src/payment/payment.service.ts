import { DatabaseService } from '@/database/database.service';
import { UsersService } from '@/users/users.service';
import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { paymentConfig } from './config/payment.config';
// import {  } from './services/ton-api.service';
import { TelegramService } from '@/telegram/telegram.service';
import { ConfigService } from '@nestjs/config';
import { DepositType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Address } from '@ton/core';
import axios from 'axios';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { TonApiService } from './services/ton-api.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly database: DatabaseService,
    private readonly tonApiService: TonApiService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
    // private readonly paymentService: PaymentService,
  ) { }

  private fragmentPrices = {
    buyStarsRateInRub: 1.2,
    sellStarsRateInRub: (1.2) * (1 - 0.15),
    premiumPrice3Months: 960,
    premiumPrice6Months: 1280,
    premiumPrice12Months: 2320,
  }

  private token = this.configService.get('CRYPTOBOT_API_TOKEN');


  getDepositLimits() {
    return {
      minAmount: paymentConfig.minAmount,
      maxAmount: paymentConfig.maxAmount,
    }
  }

  async getWalletBalance(address: string): Promise<string> {
    return await this.tonApiService.getAccountBalance(address);
  }

  private generateMemo(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isTonAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  async getPendingDepositsByType(type: DepositType) {
    return await this.database.deposit.findMany({
      where: {
        status: 'PENDING',
        type,
      },
      include: {
        user: true,
        ton: true,
        // cryptoBot: true,
        stars: true,
      }
    });
  }


  // async cancelDeposit(userId: string, type: DepositType) {
  //   const deposit = await this.database.deposit.findFirst({
  //     where: { userId, type }
  //   })

  //   if (!deposit) {
  //     throw new Error('Deposit not found');
  //   }

  //   await this.database.deposit.update({
  //     where: { id: deposit.id },
  //     data: {
  //       status: 'FAILED'
  //     }
  //   })
  // }

  // async createDeposit(telegramId: string): Promise<string> {
  //   const user = await this.usersService.findUserByTelegramId(telegramId);

  //   const memo = this.generateMemo(8);
  //   console.log(memo);



  //   await this.database.deposit.create({
  //     data: {
  //       userId: user.id,
  //       memo,
  //     }
  //   })

  //   return memo;
  // }



  // ______create deposits__________
  async createDepositStars(
    userId: string,
    amountInStars: Decimal,
    recipientUsername: string,
    giftId: string,
    giftAmount: number,
    message?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.database;
    return await db.deposit.create({
      data: {
        userId,
        type: 'STARS',
        status: "PENDING",
        amountInStars,
        stars: {
          create: {
            giftAmount,
            recipientUsername,
            giftId,
            message,
          }
        }
      }
    })
  }

  // async createDepositCryptoBot(userId: string, invoiceId: string, amountInStars: Decimal, amountInUsd: Decimal) {
  //   console.log(amountInStars, amountInUsd)
  //   const deposit = await this.database.deposit.create({
  //     data: {
  //       userId,
  //       type: 'CRYPTOBOT',
  //       amountInStars,
  //       cryptoBot: { create: { invoiceId, amountInUsd } }
  //     },
  //   });

  //   return deposit;
  // }

  async createDepositTon(
    userId: string,
    boc: string,
    username: string,
    giftId: string,
    giftAmount: number,
    amountInStars: Decimal,
    amountInTon: Decimal,
    message: string | undefined,
    memo: string,
  ) {

    const existingDeposit = await this.database.depositTon.findUnique({
      where: {
        boc,
      },
    });

    if (existingDeposit) {
      throw new BadRequestException('Deposit with this boc already exists');
    }

    const deposit = await this.database.deposit.create({
      data: {
        userId,
        type: 'TON',
        amountInStars,
        ton: {
          create: {
            amountInTon,
            giftId,
            giftAmount,
            recipientUsername: username,
            boc,
            memo,
            message,
          }
        },
      },
    });

    return deposit;
  }

  // ______________update deposits__________

  // async createAndConfirmDepositStars(userId: string, telegramOperationId: string, amountInStars: Decimal) {
  //   const deposit = await this.database.$transaction(async (tx) => {
  //     const d = await this.createDepositStars(userId, amountInStars, '', '', 1, tx);
  //
  //     await tx.user.update({
  //       where: { id: d.userId },
  //       data: { balance: { increment: d.amountInStars } },
  //     });
  //
  //     return d;
  //   });
  //   return deposit;
  // }

  // async confirmDepositCryptoBot(invoiceId: string) {
  //   const deposit = await this.database.$transaction(async (tx) => {

  //     const cryptoBotRecord = await tx.depositCryptoBot.update({
  //       where: { invoiceId },
  //       data: {
  //         deposit: {
  //           update: { status: 'COMPLETED' }
  //         }
  //       },
  //       include: { deposit: true }
  //     });

  //     const d = cryptoBotRecord.deposit;

  //     await tx.user.update({
  //       where: { id: d.userId },
  //       data: { balance: { increment: d.amountInStars } },
  //     });

  //     return d;
  //   });
  //   return deposit;
  // }

  async confirmDepositTon(deposit: Prisma.DepositGetPayload<{ include: { ton: true } }>, senderAddress: string) {

    console.log("confirmDepositTon", senderAddress)
    const depositTon = await this.database.$transaction(async (tx) => {

      const tonRecord = await tx.depositTon.update({
        where: { depositId: deposit.id },
        data: {
          fromAddress: senderAddress,
          deposit: {
            update: { status: 'COMPLETED' }
          }
        },
        include: { deposit: true }
      });

      await tx.user.update({
        where: { id: tonRecord.deposit.userId },
        data: {
          balance: {
            increment: tonRecord.deposit.amountInStars
          }
        }
      });

      return tonRecord;
    });
    return depositTon;
  }

  async getDepositWithStarsById(id: string) {
    return this.database.deposit.findUnique({
      where: { id },
      include: { stars: true },
    });
  }

  async markDepositCompleted(id: string) {
    return this.database.deposit.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  //  ______create invoice links________

  async createStarsInvoiceLink(
    userId: string,
    starsAmount: number,
    recipientUsername: string,
    giftId: string,
    giftAmount: number,
    message?: string,
  ) {
    const deposit = await this.createDepositStars(
      userId,
      new Decimal(starsAmount),
      recipientUsername,
      giftId,
      giftAmount,
      message,
    );
    const invoiceLink = await this.bot.telegram.createInvoiceLink({
      title: '⭐️ Подтверждение продажи',
      description: `Пополнение баланса на ${starsAmount} ⭐`,
      payload: deposit.id,
      provider_token: '',
      currency: 'XTR',
      prices: [
        { label: `${starsAmount} ⭐`, amount: starsAmount }
      ],
    });

    return invoiceLink;
  }

  async createCryptoBotInvoiceLink(userId: string, amountInUsd: number, amountInStars: number) {


    const response = await axios.post('https://pay.crypt.bot/api/createInvoice',
      {
        currency_type: 'fiat',
        fiat: 'USD',
        amount: amountInUsd,
        accepted_assets: 'USDT,TON,BTC',
        payload: userId,
        description: 'Пополнение баланса',
        paid_btn_name: 'callback',
        paid_btn_url: 'https://gamepablo.com/'
      },
      {
        headers: {
          'Crypto-Pay-API-Token': this.token,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    console.log(data);


    return data.result.mini_app_invoice_url;
  }

  async createCryptoBotCheckLink(telegramId: string, amountInUsd: number) {
    try {
      const response = await axios.post('https://pay.crypt.bot/api/createCheck',
        {
          asset: 'USDT',
          amount: amountInUsd,
          // pin_to_user_id: Number(telegramId),
        },
        {
          headers: {
            'Crypto-Pay-API-Token': this.token,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (data.ok) {
        console.log(data)
        // Возвращаем прямую ссылку на чек
        return data.result.bot_check_url;
      } else {
        throw new Error(`Ошибка API: ${data.error.name} (${data.error.code})`);
      }
    } catch (error) {
      console.error('CryptoBot createCheckLink error:', error);
      throw error;
    }
  }

  // _______referral system__________

}
