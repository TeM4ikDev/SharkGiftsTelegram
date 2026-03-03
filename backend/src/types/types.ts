import { Prisma, } from "@prisma/client";

export const superAdminsTelegramIds: string[] = [
  '2027571609',
  '5447030476'
]

export type IUser = Prisma.UserGetPayload<{ include: { UsersConfig: true } }>

export interface ITelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ITelegramCommand {
  command: string | RegExp;
  description?: string;
}

export enum BotScenes {
  MIN_PROFIT = 'MINPROFIT'

}


export const PLATEGA_RATE_TO_SOURCE_PRICE_DIVIDER = 1.09;

export type PlategaPaymentMethod = 2 | 13; // 2 - СБП, 13 - Крипто по доке



export interface ITgUser {
  username?: string;
  telegramId?: string;
  registrationDate?: Date;
  collectionUsernames?: string[];
}


export type IGlobalConfig = Prisma.GlobalConfigGetPayload<{}>


export interface IUserTwink {
  username?: string
  telegramId?: string
  collectionUsernames?: string[];
  registrationDate?: Date
}


export interface IScammerData {
  username?: string
  telegramId?: string
  twinAccounts?: IUserTwink[];
  collectionUsernames?: string[];
  registrationDate?: Date
}

export interface IUserClientData {
  telegramId: string;
  premium: boolean;
  about: string;
  username: string | null;
  collectionUsernames: string[];
  // registrationDate: Date;
  // registrationDateString: string;
}


export type IScammerQuery = {
  username?: string
  telegramId?: string,
  unknown?: string
}
// | string



export interface IMediaData {
  type: string;
  file_id: string;
}






