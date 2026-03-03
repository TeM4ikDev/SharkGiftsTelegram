import { DatabaseService } from '@/database/database.service';
import { FragmentApiService } from '@/payment/services/fragment.api.service';
import { TelegramService } from '@/telegram/telegram.service';
import { UsersService } from '@/users/users.service';
import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { TelegramPremiumMonth } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';


interface ICreateGiftData {
  giftId: string,
  title: string,
  slug: string,
  num: string,
  model: string,
  symbol: string,
  backdrop: string,
}


const PREMIUM_PRICES: Record<TelegramPremiumMonth, number> = {
  [TelegramPremiumMonth.MONTHS_3]: 1500,
  [TelegramPremiumMonth.MONTHS_6]: 2500,
  [TelegramPremiumMonth.MONTHS_12]: 4500,
};

@Injectable()
export class GiftService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly database: DatabaseService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,

    private readonly fragmentApiService: FragmentApiService
  ) { }



  async create(telegramId: string, giftData: ICreateGiftData) {
    const user = await this.usersService.findUserByTelegramId(telegramId);
    if (!user) throw new Error('Пользователь не найден');

    const existingGift = await this.findGiftByGiftId(giftData.giftId);
    // if (existingGift && !existingGift.isSold) throw new Error('Подарок уже существует');

    console.log(giftData);
    // const marketGift = this.getMarketGift(giftData.title);
    // if (!marketGift) throw new BadRequestException('Подарок не найден');

    const config = this.telegramService.getGlobalConfig();


    // const gift = await this.database.gift.create({
    //   data: {
    //     ...giftData,
    //   }
    // });


    // const newBalance = await this.usersService.addUserBalance(user.id, sellPriceInStars);



    // return gift;
  }


  async buyGift(userId: string, giftId: string) {
    const user = await this.usersService.findUserById(userId);
    if (!user) throw new Error('Пользователь не найден');

    const gift = await this.findGiftById(giftId);
    if (!gift) throw new Error('Подарок не найден');

    // if (gift.isSold) throw new BadRequestException('Подарок уже куплен');
    // if (gift.sellerUserId === userId) throw new BadRequestException('Нельзя купить свой подарок');

    if (user.balance < gift.priceInStars) {
      throw new BadRequestException('Недостаточно средств');
    }

    await this.database.$transaction(async (tx) => {
      // await tx.gift.update({
      //   where: { id: giftId },
      //   data: {
      //     isSold: true,
      //     buyerUserId: user.id,
      //   },
      // });

      await this.usersService.addUserBalance(user.id, gift.priceInStars.neg(), tx);


    });

    // async sendGiftToTelegramUser
  }


  async buyPremium(userId: string, premiumType: TelegramPremiumMonth) {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const price = new Decimal(PREMIUM_PRICES[premiumType]);

    if (!price || price.lte(0)) {
      throw new BadRequestException('Неверный тип премиума');
    }

    if (user.balance < price) {
      throw new BadRequestException('Недостаточно средств');
    }

    // Вычитаем баланс у пользователя
    await this.usersService.addUserBalance(user.id, price.neg());

    // Здесь можно добавить логику активации премиума в Telegram
    // Например, через TelegramService
    const months = premiumType === TelegramPremiumMonth.MONTHS_3 ? 3
      : premiumType === TelegramPremiumMonth.MONTHS_6 ? 6
        : premiumType === TelegramPremiumMonth.MONTHS_12 ? 12 : 0;

    // Отправляем уведомление пользователю
    await this.telegramService.sendMessage(
      user.telegramId,
      `Вы успешно приобрели Telegram Premium на ${months} ${months === 3 ? ' месяцев' : months < 5 ? 'месяца' : 'месяцев'}!\n\nСтоимость: ${price.toFixed(2)} звезд`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: "Профиль", web_app: { url: `https://gamepablo.com/profile` } }]
          ]
        }
      }
    );

    return {
      success: true,
      premiumType,
      months,
      price: price.toFixed(2),
    };
  }

  async buyShopProduct(userId: string, productId: string, targetUsername?: string) {
    const user = await this.usersService.findUserById(userId);
    if (!user) throw new BadRequestException('Пользователь не найден');

    const product = await (this.database as any).shopProduct.findUnique({
      where: { id: productId },
    });

    console.log(product, "product");
    if (!product) throw new BadRequestException('Товар не найден');

    const price = new Decimal(product.priceInStars);
    if (price.lte(0)) throw new BadRequestException('Неверная цена товара');
    if (user.balance < price) throw new BadRequestException('Недостаточно средств');

    console.log(product.type)

    if (product.type === 'PREMIUM' && product.premiumMonths) {
      const months = product.premiumMonths === 'MONTHS_3' ? 3
        : product.premiumMonths === 'MONTHS_6' ? 6
          : product.premiumMonths === 'MONTHS_12' ? 12 : 0;


      const username = targetUsername?.trim() || user.username;
      const success = await this.fragmentApiService.sendPremium(username, product.premiumMonths, price, user.telegramId);
      if (!success) throw new BadRequestException('Не удалось приобрести премиум');


      await this.telegramService.sendMessage(
        user.telegramId,
        `Вы приобрели ${product.name}. Telegram Premium на ${months} мес. Стоимость: ${price.toFixed(2)} звёзд.`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: 'Профиль', web_app: { url: 'https://gamepablo.com/profile' } }]],
          },
        },
      );
    }
    else if (product.type === 'STARS') {
      await this.usersService.addUserBalance(user.id, price.neg());

      await this.telegramService.sendMessage(
        user.telegramId,
        `Вы приобрели ${product.name}. Стоимость: ${price.toFixed(2)} звёзд.`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: 'Профиль', web_app: { url: 'https://gamepablo.com/profile' } }]],
          },
        },
      );

    }

    await this.usersService.addUserBalance(user.id, price.neg());

    // else if (product.type === 'GIFT') {
    //   await this.buyGift(user.id, product.id);
    //   await this.usersService.addUserBalance(user.id, price.neg());
    // }

    return { success: true, productId, price: price.toFixed(2) };
  }

  async findAll() {
    return this.database.gift.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        // isSold: false,
      },
    });
  }

  /** Первые 4 подарка для блока на главной (с lottie на фронте по slug) */
  async getFeatured() {
    return this.database.gift.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
    });
  }

  async getShopProducts() {
    return (this.database as any).shopProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findGiftById(id: string) {
    return this.database.gift.findUnique({
      where: {
        id: id,
      }
    });
  }

  async findGiftByGiftId(id: string) {
    return this.database.gift.findUnique({
      where: {
        giftId: id,
      }
    });
  }

}
