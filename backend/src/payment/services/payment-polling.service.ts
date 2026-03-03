import { DatabaseService } from '@/database/database.service';
import { TelegramService } from '@/telegram/telegram.service';
import { TonTransaction } from '@/types/ton-api.types';
import { UsersService } from '@/users/users.service';
import { nanoTontoTon } from '@/utils';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { paymentConfig } from '../config/payment.config';
import { PaymentService } from '../payment.service';
import { TonApiService } from './ton-api.service';
// import { Transaction } from '@ton/ton';

import { superAdminsTelegramIds } from '@/types/types';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Decimal } from '@prisma/client/runtime/library';
import { Address, beginCell, Cell, contractAddress, loadMessage, StateInit, TonClient, Transaction } from "@ton/ton";
import axios from 'axios';
import { IUser } from '@/types/types';




@Injectable()
export class PaymentPollingService {
  private readonly logger = new Logger(PaymentPollingService.name);
  private readonly apiToken = this.configService.get('CRYPTOBOT_API_TOKEN');


  constructor(
    private readonly database: DatabaseService,
    private readonly tonApiService: TonApiService,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly usersService: UsersService,
  ) { }


  private instance = axios.create({
    baseURL: 'https://pay.crypt.bot/api',
    headers: {
      'Crypto-Pay-API-Token': this.apiToken,
      'Content-Type': 'application/json',
    },
  });

  private lastTransactions = [];
  private usdtMasterAddress = Address.parse("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs");

  async onModuleInit() {
    // await this.checkPendingPayments();
    // await this.handleStarsSellPolling();


    // await this.main();
    // console.log(await this.checkIsRealUsdt("EQAixb12e0l-GTOt75an-xSeBOSSnUjpPCgJsReWvfpZv0WW"))

    // console.log("/".repeat(10))

    // // await this.main2();
    // await this.getJettonData();

    // console.log(this.parseUsdtTransaction("te6cckEBAgEAQgABYnNi0JwAAAAAAAAAADAmVIgAsL1N0xvRToZYE3Ch34uqsyluB7kchUfEwkpJH77BxasBABgAAAAANW90YTE4ZneuXDpQ"))

    // console.log("Результат:", this.getMemo("te6cckEBAgEAQgABYnNi0JwAAAAAAAAAADAmVIgAsL1N0xvRToZYE3Ch34uqsyluB7kchUfEwkpJH77BxasBABgAAAAANW90YTE4ZneuXDpQ")); // Выведет: 5ota18fw
  }

  parseUsdtTransaction(base64Body: string) {
    try {
      const cell = Cell.fromBase64(base64Body);
      const slice = cell.beginParse();

      const op = slice.loadUint(32);

      if (op === 0x7362d09c) {
        slice.skip(64);

        const rawAmount = slice.loadCoins();
        const amountUsdt = Number(rawAmount) / 1_000_000;

        slice.loadAddress();

        let memo = '';
        const payload = slice.loadBit() ? slice.loadRef().beginParse() : slice;

        if (payload.remainingBits >= 32 && payload.loadUint(32) === 0) {
          memo = payload.loadBuffer(payload.remainingBits / 8).toString('utf-8');
        }

        return {
          // type: 'USDT_TRANSFER',
          amount: new Decimal(amountUsdt), // Вернет 0.15
          memo: memo          // Вернет "5ota18fw"
        };
      }

      // Если это просто обычный текстовый перевод (не USDT)
      if (op === 0x00000000) {
        const memo = slice.loadBuffer(slice.remainingBits / 8).toString('utf-8');
        return { amount: 0, memo };
      }

      return { amount: 0, memo: '' };

    } catch (e) {
      console.error("Ошибка парсинга:", e instanceof Error ? e.message : 'Неизвестная ошибка');
      return null;
    }
  }

  async checkIsRealUsdt(jettonWalletAddressString: string): Promise<boolean> {
    try {
      const client = new TonClient({
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
        // headers: {
        apiKey: process.env.TON_API_KEY
        // }
        // apiKey: process.env.TONCENTER_API_KEY, // Без ключа будут частые ошибки 429
      });

      const jettonWalletAddress = Address.parse(jettonWalletAddressString);
      const result = await client.runMethod(jettonWalletAddress, "get_wallet_data");


      const stack = result.stack;
      stack.readBigNumber(); // Пропускаем баланс
      stack.readAddress();   // Пропускаем owner_address

      const masterAddressFromBlockchain = stack.readAddress();

      // Сравниваем через метод .equals() для 100% точности
      const isReal = masterAddressFromBlockchain.equals(this.usdtMasterAddress);

      console.log(`Проверка: ${isReal ? 'Настоящий USDT' : 'ФЕЙК!'} (Master: ${masterAddressFromBlockchain.toString()})`);

      return isReal;
    } catch (e) {
      console.error("Не удалось проверить Jetton Wallet:", e);
      return false;
    }
  }

  async getJettonData() {
    const jettonwalletcode = Cell.fromHex(
      "b5ee9c72010101010023000842028f452d7a4dfd74066b682365177259ed05734435be76b5fd4bd5d8af2b7c3d68",
    );

    const masterAddress = Address.parse(
      "0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe",
    );
    const ownerAddress = Address.parse("UQA1DoapWaUEcpZGW0aS00AoJ1BVJiwLBZIDX6KPdqsOUC-N");
    const jettonwalletdata = beginCell()
      // .storeAddress(ownerAddress)
      .storeAddress(masterAddress)
      .storeVarUint(0, 16) // the initial value is always zero
      .endCell();

    const jettonWalletStateInit: StateInit = {
      code: jettonwalletcode,
      data: jettonwalletdata,
    };

    const BASECHAIN = 0; // All Jetton wallet contracts are located in Basechain by default
    const jettonWalletAddress = contractAddress(BASECHAIN, jettonWalletStateInit);

    console.log(jettonWalletAddress.toString());
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkPendingPayments() {
    try {
      const pendingPayments = await this.paymentService.getPendingDepositsByType('TON');
      // console.log(pendingPayments)

      this.lastTransactions = await this.tonApiService.getTransactions();
      // console.log(this.lastTransactions.length)
      // return

      if (pendingPayments.length > 0) {
        for (const payment of pendingPayments) {
          await this.verifyTonDeposit(payment);
        }
      }
    } catch (error) {
      console.log(error)
      // this.logger.error(`Ошибка при проверке платежей: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  async verifyTonDeposit(deposit: Prisma.DepositGetPayload<{ include: { ton: true, user: true } }>) {
    try {
      const paymentAge = Date.now() - deposit.createdAt.getTime();
      if (paymentAge > paymentConfig.paymentLifetime * 1000) {
        await this.database.deposit.update({
          where: { id: deposit.id },
          data: { status: 'EXPIRED' }
        });
        this.logger.log(`Платеж ${deposit.id} истек`);
        return;
      }

      if (deposit.status === 'COMPLETED') {
        console.log('completed')
        return;
      }

      const foundTx = this.lastTransactions.find(p => p.in_msg.message === deposit.ton.memo);
      
      console.log(foundTx)
      if (!foundTx && !foundTx) {
        console.log('not found')
        return;
      }

      if (deposit.status === 'PENDING') {
          await this.paymentService.confirmDepositTon(deposit,  foundTx.in_msg.message.source);
          await this.telegramService.showDepositSuccess(deposit.user as IUser, deposit.amountInStars);
      }

    } catch (error) {
      console.log(error)
    }
  }

  // private async processPayment(deposit: Prisma.DepositGetPayload<{ include: { user: true } }>) {

  //   // console.log(deposit)
  //   try {
  //     const paymentAge = Date.now() - deposit.createdAt.getTime();
  //     if (paymentAge > paymentConfig.paymentLifetime * 1000) {
  //       await this.database.deposit.update({
  //         where: { id: deposit.id },
  //         data: { status: 'EXPIRED' }
  //       });
  //       this.logger.log(`Платеж ${deposit.id} истек`);
  //       return;
  //     }


  //     if (deposit.status === 'COMPLETED') {
  //       console.log('completed')
  //       return;
  //     }

  //     const existingPaymentTon = this.lastTransactions.find(p => p.in_msg.message === deposit.memo);
  //     const existingPaymentUsdt = this.lastTransactions.find((p) => (p.in_msg.msg_data['@type'] == 'msg.dataRaw' && this.parseUsdtTransaction(p.in_msg.msg_data.body)?.memo === deposit.memo));

  //     if (!existingPaymentTon && !existingPaymentUsdt) {
  //       console.log('not found')
  //       return;
  //     }
  //     console.log(existingPaymentTon || this.parseUsdtTransaction(existingPaymentUsdt.in_msg.msg_data.body).amount)
  //     console.log(nanoTontoTon(Number(existingPaymentTon?.in_msg.value || existingPaymentUsdt?.in_msg.value)))






  //     if (deposit.status === 'PENDING') {
  //       let updatedDeposit = null

  //       if (existingPaymentUsdt) {
  //         const { amount, memo } = this.parseUsdtTransaction(existingPaymentUsdt.in_msg.msg_data.body)

  //         if (!await this.checkIsRealUsdt(existingPaymentUsdt.in_msg.source)) {
  //           await this.database.deposit.update({
  //             where: { id: deposit.id },
  //             data: { status: 'FAILED' }
  //           });



  //           throw new Error('Неверный адрес USDT master');


  //         }

  //         // const amountInRub = (this.telegramService.getGlobalConfig().usdToRubRate).mul(amount);
  //         updatedDeposit = await this.database.deposit.update({
  //           where: { id: deposit.id },
  //           data: {
  //             status: 'COMPLETED',
  //             // amountInRub: amountInRub,
  //           },
  //           include: {
  //             user: true
  //           }
  //         });
  //       }
  //       else {
  //         const amountInTon = nanoTontoTon(Number(existingPaymentTon?.in_msg.value));
  //         updatedDeposit = await this.database.deposit.update({
  //           where: { id: deposit.id },
  //           data: {
  //             status: 'COMPLETED',
  //             amountInTon: amountInTon,
  //             // amountInRub: amountInTon.mul(this.telegramService.getGlobalConfig().buyTonRateInRub),
  //             // transactionHash: existingPaymentTon?.transacti on_id.hash || existingPaymentUsdt?.transaction_id.hash,
  //           },
  //           include: {
  //             user: true
  //           }
  //         });
  //       }





  //       await this.telegramService.showDepositSuccess(updatedDeposit.user, updatedDeposit.amountInRub);
  //     }

  //   } catch (error) {
  //     this.logger.error(`Ошибка обработки платежа ${deposit.id}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);

  //     this.telegramService.sendMessage(deposit.user.telegramId, `Ошибка обработки платежа ${deposit.id}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  //   }
  // }


  // ______cryptobot polling_____




  @Cron(CronExpression.EVERY_10_SECONDS)
  async handlePolling() {
    // this.logger.log('Проверка активных инвойсов...');
    const activePayments = await this.paymentService.getPendingDepositsByType('CRYPTOBOT');

    if (activePayments.length === 0) return;

    const ids = activePayments.map(p => p.cryptoBot.invoiceId);

    try {
      const { data } = await this.instance.post('/getInvoices', {
        invoice_ids: ids,
        status: 'paid'
      });

      const invoices = data.result.items;

      for (const inv of invoices) {
        if (inv.status === 'paid') {

          // const { userId, amountStars } = JSON.parse(inv.payload);

          // console.log(userId, amountStars)

          // return
          const user = await this.usersService.findUserById(inv.payload);
          const deposit = await this.paymentService.confirmDepositCryptoBot(inv.invoice_id.toString());
          await this.telegramService.showDepositSuccess(user, deposit.amountInStars);

          this.logger.log(`Баланс пользователя ${user.telegramId} пополнен на ${inv.amount} Stars`);
        }
      }
    } catch (e) {
      console.log('Ошибка при опросе API Crypto Bot', e);
    }
  }

  // ______stars sell polling_____
  // @Cron(CronExpression.EVERY_30_SECONDS)
  // async handleStarsSellPolling() {
  //   const starsSells = await this.paymentService.getStarsSellsWhoCanBePaid();
  //   // console.log(starsSells)
  //   if (starsSells.length === 0) return;
  //   for (const starsSell of starsSells) {
  //     await this.sendConfirmWithdraw(starsSell);
  //   }
  // }


  private async sendConfirmWithdraw(starsSell: any) {
    console.log(starsSell)

    // const globalConfig = this.telegramService.getGlobalConfig();
    // const amountUsdt = starsSell.priceInRub.div(globalConfig.usdToRubRate);
    // const amountTon = starsSell.priceInRub.div(globalConfig.buyTonRateInRub);

    // await this.telegramService.sendMessage(starsSell.user.telegramId,
    //   `✅ Теперь вы можете вывести средства на свой кошелек! Ожидайте пока администратор подтвердит вывод.\n\n` +
    //   `💰 <b>Сумма:</b> <code>${starsSell.priceInRub.toFixed(2)}</code> RUB\n` +
    //   `🏦 <b>Адрес получения:</b> <code>${starsSell.cryptoAddress}</code>\n\n` +
    //   `🆔 <b>ID заявки:</b> <code>${starsSell.id}</code>`, {
    //   parse_mode: 'HTML',
    // })

    // const message = `🔔 <b>Новая заявка на вывод средств</b>\n\n` +
    //   `👤 <b>Пользователь:</b> @${starsSell.user.username || "--"} (<code>${starsSell.user.telegramId}</code>)\n` +
    //   `💰 <b>Сумма:</b> <code>${starsSell.priceInRub.toFixed(2)}</code> RUB\n\n` +
    //   `📊 <b>Эквиваленты:</b>\n` +
    //   `💵 <b>USDT:</b> <code>${amountUsdt.toFixed(4)}</code> USDT\n` +
    //   `💎 <b>TON:</b> <code>${amountTon.toFixed(4)}</code> TON\n\n` +
    //   `🏦 <b>Адрес получателя:</b>\n<code>${starsSell.cryptoAddress}</code>\n\n` +
    //   `🆔 <b>ID заявки:</b> <code>${starsSell.id}</code>`;

    // await this.telegramService.sendMessageToUsers(
    //   superAdminsTelegramIds,
    //   message, {
    //   parse_mode: 'HTML',
    //   reply_markup: {
    //     inline_keyboard: [
    //       [{ text: '📁 Подтвердить вывод', callback_data: `confirm_admin_stars_sell:${starsSell.id}` }]
    //     ]
    //   }
    // })

    // await this.onSceneLeave(ctx);
  }

}
