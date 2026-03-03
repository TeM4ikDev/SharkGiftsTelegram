import { DatabaseService } from "@/database/database.service";
import { GiftService } from "@/gift/gift.service";
import { IUserClientData } from "@/types/types";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import input from "input";
import { Logger, TelegramClient as TelegramClientClass } from "telegram";
import { LogLevel } from "telegram/extensions/Logger";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { giftEvent } from "./fixtures/gift-event.sample";

export interface ITelegramClientDataConnect {
  apiId: number;
  apiHash: string;
  phone: string;
  password: string;
  session: string | null;
}


// const clientConfig: ITelegramClientDataConnect = {
//   apiId: 29514923,
//   apiHash: "95def91b17083ec9e21c34065ed00508",
//   phone: "375296147733",
//   password: "8681",
//   session: null
// };


const clientConfig = {
  apiId: 26108203,
  apiHash: "d7832411037cf958b18e09a9403ef04c",
  phone: "+48572741800",
  password: "",
  session: "1BAAOMTQ5LjE1NC4xNjcuOTEAUI03Va5p8NHIgahmSZSspP46caFV7YbWEUaJ4g++f00jVbDYDFsWavaGyB8pKQoPmahM/5h0pgb1UzOC2mwB5MZMP63KLpeZPodZYEzgeb3Qt3gmelSbhn9Z9pVEVSUUbAunWtLIClU16UCdiX+SBUcSftvwF3+J+MRBJOCszL1q82flETM4g65GUoK6EQpm9myw2VVP5Dl2NC1IAb13Vu+qdZ/H0TsHji4xGUcw4JzPprcAKE6jUajQ6ENuG0dn2QePlq9+UzwrKiD91whlyCskR6KZYCEgCsJwfqYo8H9Jh3+8GlIvT3q30HBXQNZVBCkQ91kf5ne1jjxIPvWt6gI=",
}


@Injectable()
export class TelegramClient {

  constructor(
    @Inject(forwardRef(() => DatabaseService))
    private readonly database: DatabaseService,
    @Inject(forwardRef(() => ConfigService))
    private readonly configService: ConfigService,
    private readonly giftService: GiftService
  ) { }

  logger: Logger = new Logger(LogLevel.DEBUG);
  private client: TelegramClientClass | null = null;

  private clientAccountData = null


  async onModuleInit() {
    console.log(process.env.NODE_ENV)

    const clientsData = clientConfig;
    await this.createClient(clientsData);

    this.clientAccountData = await this.getAboutMe()
    console.log(this.clientAccountData)

     //5956217000635139069
    // 5922558454332916696
    // 5800655655995968830
    // 5801108895304779062

    // this.sendNftGift("@niggabuy", "5800655655995968830", "подарок чисто для сигмы")


    this.getFeaturedGiftsInfo()
  }



  async createClient(clientData: ITelegramClientDataConnect) {
    this.logger.debug(`Creating client for ${clientData.phone}`);
    try {
      const session = new StringSession(clientData.session);
      // console.log(session)
      const client = new TelegramClientClass(
        session,
        clientData.apiId,
        clientData.apiHash,
        { connectionRetries: 5 }
      );

      await client.start({
        phoneNumber: async () => clientData.phone,
        password: async () => clientData.password || "",
        phoneCode: async () =>
          await input.text(`Код из Telegram(${clientData.phone}): `),
        onError: (err) => console.log(err),
      });

      // console.log(portalsToken);

      console.log(`______${clientData.phone}_______`);
      console.log(client.session.save());
      console.log('')
      // console.log(token);
      console.log(`_____________`);


      this.client = client;
    } catch (err) {
      this.client = null;
      console.error("Ошибка при создании клиента:", err);
    }
  }


  getClient(): TelegramClientClass | null {
    return this.client;
  }

  getClientAccountData() {
    return this.clientAccountData
  }

  async getAboutMe() {
    try {
      const client = await this.getClientOrThrow();
      // Запрашиваем данные о себе
      const me = await client.getMe();

      if (me instanceof Api.User) {
        return {
          id: me.id.toString(),
          firstName: me.firstName,
          lastName: me.lastName,
          username: me.username,
          phone: me.phone,
          premium: me.premium,
          bot: me.bot
        };
      }
      return me;
    } catch (error) {
      this.logger.error(`Не удалось получить данные о себе: ${error}`);
      return null;
    }
  }

  private async getClientOrThrow(): Promise<TelegramClientClass> {
    if (!this.client) {
      throw new Error("Telegram client not initialized");
    }
    return this.client;
  }

  async getAvailableGifts() {
    const result = await this.client.invoke(
      new Api.payments.GetStarGifts({
        hash: 0, // 0 для получения полного списка
      })
    );


    console.log(JSON.stringify((result as any).gifts[0]))
    // В result.gifts будет массив объектов StarGift
    // const ids: any[] = (result as any).gifts.map(gift => {
    // {
    //   id: String(gift.id)
    //   msgid: gift.msgId

    // }});


    return result;
  }

 
  private static readonly FEATURED_GIFT_IDS = new Set([
    "5956217000635139069",
    "5922558454332916696",
    "5800655655995968830",
    "5801108895304779062",
  ]);

  
  async getFeaturedGiftsInfo(): Promise<
    Array<{
      giftId: string;
      title: string;
      slug: string;
      num: string;
      model?: string;
      symbol?: string;
      backdrop?: string;
    }>
  > {
    const client = await this.getClientOrThrow();
    const result = await client.invoke(
      new Api.payments.GetStarGifts({ hash: 0 })
    );
    const gifts: any[] = (result as any).gifts ?? [];
    const featured = gifts.filter((g: any) =>
      TelegramClient.FEATURED_GIFT_IDS.has(String(g.id))
    );
    return featured.map((g: any) => this.mapStarGiftToInfo(g));
  }

  /** Преобразует сырой StarGift из каталога в объект с полями giftId, title, slug, num, model, symbol, backdrop */
  private mapStarGiftToInfo(g: any): {
    giftId: string;
    title: string;
    slug: string;
    num: string;
    model?: string;
    symbol?: string;
    backdrop?: string;
  } {
    const id = g.id != null ? String(g.id) : "";
    const title = g.title ?? "";
    const slug = g.slug ?? "";
    const num = g.num != null ? String(g.num) : "";
    const attrs = g.attributes ?? [];
    return {
      giftId: id,
      title,
      slug,
      num,
      model: attrs[0]?.name,
      symbol: attrs[1]?.name,
      backdrop: attrs[2]?.name,
    };
  }

  /**
   * Получить информацию о подарке по его ID.
   * Telegram API не даёт подарок по id напрямую — запрашивается каталог GetStarGifts и ищется запись с нужным id.
   */
  async getGiftById(giftId: string): Promise<{
    giftId: string;
    title: string;
    slug: string;
    num: string;
    model?: string;
    symbol?: string;
    backdrop?: string;
  } | null> {
    const client = await this.getClientOrThrow();
    const result = await client.invoke(
      new Api.payments.GetStarGifts({ hash: 0 })
    );
    const gifts: any[] = (result as any).gifts ?? [];
    const found = gifts.find((g: any) => String(g.id) === String(giftId));
    return found ? this.mapStarGiftToInfo(found) : null;
  }

  /**
   * Отправляет уникальный (NFT) подарок пользователю
   * @param {string|BigInt} userId - ID или username получателя
   * @param {string|BigInt} giftId - ID подарка (например, 5956217000635139069)
   * @param {string} message - Сообщение к подарку (необязательно)
   */
  async sendNftGift(userId: string, giftId: string, message = "") {
    try {
      const client = await this.getClientOrThrow();
      const peer = await client.getInputEntity(userId);

      const invoice = new Api.InputInvoiceStarGift({
        peer,
        giftId: BigInt(giftId),
        // hideName: false,
        // includeUpgrade: true,
        ...(message
          ? {
              message: new Api.TextWithEntities({
                text: message,
                entities: [],
              }),
            }
          : {}),
      } as any);

      const paymentForm = await client.invoke(
        new Api.payments.GetPaymentForm({
          invoice,
          themeParams: new Api.DataJSON({
            data: "{}",
          }),
        })
      );

      const formId =
        (paymentForm as any).formId ?? (paymentForm as any).form_id;

      if (!formId) {
        throw new Error("Не удалось получить formId для оплаты подарка");
      }

      return await client.invoke(
        new Api.payments.SendStarsForm({
          formId,
          invoice,
        })
      );
    } catch (error: any) {
      // Если подарок уникальный и закончился, будет ошибка STARGIFT_USAGE_LIMITED
      console.error(
        "❌ Ошибка при отправке:",
        error?.errorMessage || error?.message || error
      );
      throw error;
    }
  }


  async getUserData(username: string): Promise<IUserClientData | null> {
    try {
      const client = await this.getClientOrThrow();
      const user = await client.invoke(
        new Api.contacts.ResolveUsername({
          username: username.replace("@", ""),
        })
      );
      if (!user) return null;
      const userId = (user as any).peer.userId.toString();
      return {
        telegramId: userId,
        username:
          (user as any)?.users[0]?.username ||
          (user as any)?.users[0]?.usernames?.[0]?.username ||
          null,
        premium: (user as any)?.users[0]?.premium || false,
        about: "",
        collectionUsernames:
          (user as any)?.users[0]?.usernames
            ?.slice(1)
            ?.map((u: any) => u.username) || null,
      };
    } catch (error) {
      this.logger.error(
        `Ошибка при получении информации пользователя ${username}: ${(error as any)?.errorMessage || (error as any)?.message}`
      );
      return null;
    }
  }

  async getAccountTelegramGifts(offset: string = "", limit: number = 10): Promise<{ gifts: any[]; nextOffset: string | null }> {
    try {
      // const client = await this.getClientOrThrow();
      const client = await this.getClientOrThrow();

      const result = await this.client.invoke(
        new Api.payments.GetSavedStarGifts({
          peer: "me",

          offset,
          limit,

          excludeLimited: true,
          // excludeUnlimited: true,
        })
      );
      // if (!result) return [];

      // console.log(result.gifts)


      const res: any[] = [];
      (result as any).gifts?.forEach((g: any) => {
        res.push(this.getGifTransformedData(g.gift as any));
      });

      const nextOffset =
        (result as any).nextOffset ??
        (result as any).next_offset ??
        null;

      return { gifts: res, nextOffset };

    } catch (error) {
      this.logger.error("Error in getAccountTelegramGifts");
      return { gifts: [], nextOffset: null };
    }
  }




  async getPortalsToken(client: TelegramClientClass): Promise<string> {
    try {
      const bot = await client.getEntity("portals");
      const peer = await client.getInputEntity("portals");

      const botApp = new Api.InputBotAppShortName({
        botId: new Api.InputUser({
          userId: bot.id,
          accessHash: (bot as any).accessHash,
        }),
        shortName: "market",
      });

      const webView = await client.invoke(
        new Api.messages.RequestAppWebView({
          peer,
          app: botApp,
          platform: "android",
        })
      );

      const url = webView.url;
      const initData = unescape(
        url.split("tgWebAppData=")[1].split("&tgWebAppVersion")[0]
      );

      const token = `tma ${initData}`;
      return token;
    } catch (error) {
      this.logger.error("Error in getPortalsToken");
      return "";
    }
  }

  async getGiftBySlug(slug: string) {
    try {
      const result = await this.client.invoke(
        new Api.payments.GetUniqueStarGift({
          slug: slug,
        })
      );
      return result;
    } catch (error) {
      console.log("Can't find gift by slug: ", slug)
      return null;
    }
  }

  async sendGiftToTelegramUser(recipientTelegramId: string, giftId: string) {
    try {
      const myPeer = await this.client.getInputEntity("me");
      const toPeer = await this.client.getInputEntity(recipientTelegramId);

      if (!toPeer) throw new Error("Recipient not found");

      const gift = await this.getGiftBySlug(giftId);
      console.log(gift)

      if (!gift) throw new Error("Gift not found");



      console.log(BigInt(gift.gift.id.toString()))

      // stargiftId — это уникальный ID конкретного экземпляра в твоем инвентаре
      // const result = await this.client.invoke(
      //   new Api.payments.TransferStarGift({
      //     stargift: new Api.InputSavedStarGiftUser({
      //       peer: myPeer,
      //       savedId: BigInt(gift.gift.id.toString()), // Передаем BigInt значение из твоего вывода
      //     } as any),
      //     toId: toPeer,
      //   })
      // );

      const giftOpts = await this.client.invoke(
        new Api.payments.GetPaymentForm({
          invoice: new Api.InputInvoiceStarGiftTransfer({
            stargift: (new Api.InputSavedStarGiftUser({ msgId: 2187 })),
            toId: toPeer
          }),
          themeParams: new Api.DataJSON({
            data: "some string here",
          }),
        })
      );

      console.log(giftOpts)


      // const d: TypeInputSavedStarGift ={}

      // return result;
    } catch (error) {
      this.logger.error(`Ошибка трансфера NFT: ${error}`);
      throw error;
    }
  }

  getGifTransformedData(gift: typeof giftEvent.message.action.gift) {

    // const gift = event.message.action.gift;

    const id = gift.id;
    const title = gift.title;
    const slug = gift.slug;
    const num = gift.num;
    const model = gift.attributes[0].name;
    const symbol = gift.attributes[1].name;
    const backdrop = gift.attributes[2].name;

    // const date = (gift as any).date

    return {
      giftId: id,
      title: title,
      slug: slug,
      num: num.toString(),
      model: model,
      symbol: symbol,
      backdrop: backdrop,

      // date,
    };

  }


  async testSimulateGiftEvent() {
    const event = giftEvent

    if (event && event.message && event.message.action.className == "MessageActionStarGiftUnique") {
      const gift = event.message.action.gift;
      const senderId = event.message.peerId.userId

      const giftData = this.getGifTransformedData(gift)

      const createdGift = await this.giftService.create(senderId, giftData);

      return createdGift;
    }



  }
}
