import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// import { TonClient, WalletContractV4, beginCell, internal } from "ton";
// import { USER_ADMIN_IDS } from '@/telegram/constants/telegram.constants';
import { TelegramService } from '@/telegram/telegram.service';
import { UsersService } from '@/users/users.service';
// import { TonApiClient } from '@ton-api/client';
import { Address, beginCell, Cell, fromNano, internal, loadMessage, Message, SendMode, storeMessage, toNano, TonClient, Transaction, WalletContractV3R2, WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { mnemonicToPrivateKey, mnemonicToWalletKey } from "ton-crypto";
import { PaymentService } from '../payment.service';
// import { ContractAdapter } from '@ton/ton/lib/wrappers/ContractAdapter';

import { ContractAdapter } from '@ton-api/ton-adapter';
import { retry } from 'rxjs';


interface TonTransaction {
  hash: string;
  lt: string;
  account: {
    address: string;
  };
  in_msg: {
    source: string;
    destination: string;
    value: string;
    body: string;
  };
  out_msgs: Array<{
    source: string;
    destination: string;
    value: string;
    body: string;
  }>;
}

const client = new TonClient({
  endpoint: "https://toncenter.com/api/v2/jsonRPC",
  // https://testnet.toncenter.com/api/v2/jsonRPC
  apiKey: process.env.TON_API_KEY

});


@Injectable()
export class TonApiService implements OnModuleInit {
  private readonly TON_API_BASE_URL = 'https://toncenter.com/api/v2';

  private targetAddress = this.configService.get('TARGET_WALLET_ADDRESS');
  private tonMnemonic = this.configService.get('TON_WITHDRAW_MNEMONIC');


  private logger = new Logger(TonApiService.name);

  // private keyPair: any;
  // private wallet: any;
  // private contract: any;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService
  ) { }

  private async initializeTonClient() {
    // const adapter = new ContractAdapter(ta);

    // const mnemonic = this.tonMnemonic.split(" ");
    // // console.log(mnemonic, 'mnemonic')
    // this.keyPair = await mnemonicToPrivateKey(mnemonic);
    // // console.log(this.keyPair, 'keyPair')
    // this.wallet = WalletContractV4.create({ workchain: -1, publicKey: this.keyPair.publicKey, });

    // //  console.log(this.wallet, 'wallet')
    // console.log("Wallet Address (V5R1):", this.wallet.address.toString({ bounceable: false, testOnly: false }));


    // // const adapter = new ContractAdapter(client);
    // this.contract = client.open(this.wallet);
    // console.log(this.contract, 'contract')
  }

  private instance = axios.create({
    baseURL: this.TON_API_BASE_URL,
    headers: {
      'X-API-Key': process.env.TON_API_KEY
    }
  })

  getNormalizedExtMessageHash(message: Message) {
    if (message.info.type !== 'external-in') {
      throw new Error(`Message must be "external-in", got ${message.info.type}`);
    }

    const info = {
      ...message.info,
      src: undefined,
      importFee: 0n
    };

    const normalizedMessage = {
      ...message,
      init: null,
      info: info,
    };

    return beginCell()
      .store(storeMessage(normalizedMessage, { forceRef: true }))
      .endCell()
      .hash();
  }

  async getTransactionByInMessage(
    inMessageBoc: string,
    transactions: Transaction[]
  ): Promise<Transaction | undefined> {
    const inMessage = loadMessage(Cell.fromBase64(inMessageBoc).beginParse());

    if (inMessage.info.type !== 'external-in') {
        throw new Error(`Message must be "external-in", got ${inMessage.info.type}`);
    }
    const account = inMessage.info.dest;

    console.log(account)

    const targetInMessageHash = this.getNormalizedExtMessageHash(inMessage);

  
    if (transactions.length === 0) {
      return undefined;
    }

    // Step 5. Search for a transaction whose input message matches the normalized hash
    for (const transaction of transactions) {
      if (transaction.inMessage?.info.type !== 'external-in') {
        continue;
      }

      const inMessageHash = this.getNormalizedExtMessageHash(transaction.inMessage);
      if (inMessageHash.equals(targetInMessageHash as unknown as Uint8Array)) {
        return transaction;
      }
    }

    return undefined;

  }

  // private async retry<T>(fn: () => Promise<T>, options: { retries: number; delay: number }): Promise<T> {
  //   let lastError: Error | undefined;
  //   for (let i = 0; i < options.retries; i++) {
  //     try {
  //       return await fn();
  //     } catch (e) {
  //       if (e instanceof Error) {
  //         lastError = e;
  //       }
  //       await new Promise((resolve) => setTimeout(resolve, options.delay));
  //     }
  //   }
  //   throw lastError;
  // }


  getNonBounceableAddress(address: string) {
    const addr = Address.parse(address);
    return addr.toString({ bounceable: false, testOnly: false });
  }

  async onModuleInit() {
    await this.initializeTonClient();
    const rawAddress = "EQBYXqbpjeinQywJuFDvxdVZlLcD3I5Co-JhJSSP32Di1VOG";

    // 1. Создаем объект адреса
    const addr = this.getNonBounceableAddress(rawAddress);
    console.log(addr, 'addr')
    // console.log((await this.getTransactions(this.targetAddress, 10))[0])

    // const tx = await this.getTransactionByInMessage(
    //   'te6cckEBAgEA7QAB4YgAsL1N0xvRToZYE3Ch34uqsyluB7kchUfEwkpJH77BxaoD8rWpAolrNov5hoYgbc4+YlZEvPy2mjYpicvnycNRX+XQeCIjbsi8EwFwy4vNEuUxrdGEf97iJzsc+WOWImPYeU1NGLtLxUoIAAAESAAcAQDuQgBbffq+//YubdbZqOtY4kZY5LPLQLINknGcKO7GKkoTLKAX14QAAAAAAAAAAAAAAAAAAAAAAAB7InVzZXJJZCI6IjUzMTdkNWUxLTJhNGYtNDQwOC1iMjVjLTcwMjNhMDE5ZTg4OCIsImFtb3VudCI6MC4wNX0aNZTK',
    //   client
    // );


    // if (tx) {
    //   console.log('Found transaction:', tx);
    // } else {
    //   console.log('Transaction not found');
    // }


    // console.log(await this.verifyTonDeposit("te6cckEBAgEAqgAB4YgAsL1N0xvRToZYE3Ch34uqsyluB7kchUfEwkpJH77BxaoACYKeeZj0gYtXs8JoVgnPWZgRGQqFQa5oPzaYfeIfbXjxsSuevijPp3Ev6wvPzEsnNyJEAlReF4xTjRwPONm4UU1NGLtLwRc4AAAEQAAcAQBoQgBbffq+//YubdbZqOtY4kZY5LPLQLINknGcKO7GKkoTLKAX14QAAAAAAAAAAAAAAAAAAOf9Ifs="))
    // console.log("account balance", await this.contract.getBalance())

    // this.test()
    // console.log(toNano(parseFloat("0.16387020700146833934").toFixed(9)), 'toNano')


    // this.getTransactionByHash(testAddress, testTransactionHash)
    // console.log(await this.getAccountBalance(testAddress))
    // console.log(await this.getAccountTransactions(testAddress))
  }

  async getAccountBalance(address?: string): Promise<string> {
    try {
      const response = await this.instance.get(`/getAddressBalance`, {
        params: {
          address: this.targetAddress
        }
      });

      console.log(response.data)

      if (response.data.ok) {
        return fromNano(response.data.result);
      }

      return null;
    } catch (error) {
      console.log(error)
      return null;
    }
  }

  async getTransactions(address?: string, limit: number = 10): Promise<Transaction[]> {
    // try {
    //   console.log(Address.parse(this.targetAddress), 'address getTransactions')
    //   const transactions = await client.getTransactions(Address.parse(this.targetAddress), {
    //     limit: limit,
    //     archival: true,

    //   });

    //   console.log(transactions[0].inMessage)

    //   return transactions;
    // } catch (error) {
    //   console.log(error)
    //   return [];
    // }

    try {
      const response = await this.instance.get(`/getTransactions`, {
        params: {
          address: this.targetAddress,
          limit: limit,
          include_msg_body: true,
          include_msg_data: true,
          archival: true
        }
      });

      // console.log(response.data)

      if (response.data.ok) {
        return response.data.result;
      }

      return [];
    } catch (error) {
      console.log(error)
      return [];
    }
  }


}
