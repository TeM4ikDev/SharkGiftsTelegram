import { TelegramService } from "@/telegram/telegram.service";
import { TelegramClient } from "@/telegram/updates/TelegramClient";
import { FragmentApiBuyStarsResponse } from "@/types/ton-api.types";
import { UsersService } from "@/users/users.service";
import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TelegramPremiumMonth } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import axios, { AxiosResponse } from "axios";

enum TelegramPremiumMonths {
  THREE_MONTHS = 3,
  SIX_MONTHS = 6,
  ONE_YEAR = 12,
}



@Injectable()
export class FragmentApiService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
    @Inject(forwardRef(() => TelegramClient))
    private readonly telegramClient: TelegramClient
  ) { }

  private readonly apiUrlStars = 'https://api.fragment-api.com/v1/order/stars/';
  private readonly apiUrlPremium = 'https://api.fragment-api.com/v1/order/premium/';
  private FRAGMENT_API_KEY = this.configService.get('FRAGMENT_API_KEY');

  private instanceStars = axios.create({
    baseURL: this.apiUrlStars,
    headers: {
      'Authorization': `JWT ${this.FRAGMENT_API_KEY}`,
      'Content-Type': 'application/json',
    }
  })

  private instancePremium = axios.create({
    baseURL: this.apiUrlPremium,
    headers: {
      'Authorization': `JWT ${this.FRAGMENT_API_KEY}`,
      'Content-Type': 'application/json',
    }
  })

  async sendStars(username: string, starsAmount: number, priceInRub: Decimal, buyerTelegramId: string) {
    console.log(this.FRAGMENT_API_KEY.slice(0, 10))

    try {
      username = username.replace('@', '');
      console.log('Sending stars to:', username);

      // Проверяем существование пользователя
      const buyerUser = await this.usersService.findUserByTelegramId(buyerTelegramId);
      if (!buyerUser) {
        throw new Error('Buyer user not found');
      }

      if (starsAmount < 50 || starsAmount > 1000000) {
        throw new Error('Stars amount is not in the range of 50 to 1000000');
      }

      // Баланс уже списан в payment.service.ts, здесь только выполняем API запрос
      const response: AxiosResponse<FragmentApiBuyStarsResponse> = await this.instanceStars.post('/', {
        username,
        quantity: starsAmount,
        show_sender: false,
      })

      // console.log('Fragment API response:', response.data)    
      if (response.data.success === true) {
        return true;
      }

      console.warn('Fragment API вернул success=false.');
      return false;

    } catch (error: any) {
      console.error('Fragment error:', error.response?.data || error.message);
      console.error('Error stack:', error.stack);
      return false;
    }
  }

  async sendPremium(username: string, telegramPremiumType: TelegramPremiumMonth, priceInRub: Decimal, buyerTelegramId: string) {
    // try {
    const targetUsername = username.replace('@', '');
    console.log('Sending premium to:', targetUsername);

    const buyerUser = await this.usersService.findUserByTelegramId(buyerTelegramId);
    if (!buyerUser) {
      throw new BadRequestException('Покупатель не найден');
    }

    const recipientData = await this.telegramClient.getUserData(targetUsername);

    console.log(recipientData, "recipientData");
    if (!recipientData) {
      throw new BadRequestException('Получатель не найден');
    }

    if (recipientData.premium) {
      throw new BadRequestException('Получатель уже имеет Telegram Premium');
    }

    console.log(recipientData, "recipientData");

    console.log({
      targetUsername,
      months: TelegramPremiumMonths[telegramPremiumType],
      show_sender: false,
    })


    try {

      // const response: AxiosResponse<any> = await this.instancePremium.post('/', {
      //   targetUsername,
      //   months: TelegramPremiumMonths[telegramPremiumType],
      //   show_sender: false,
      // })

      // console.log('Fragment API response:', response.data)

      // if (response.data.success === true) {
      return true;
      // }

      console.warn('Fragment API вернул success=false.');
      return false;

    } catch (error: any) {
      console.error('Fragment error:', error.response?.data || error.message);
      console.error('Error stack:', error.stack);
      return false;
    }
  }
}