import { AxiosInstance } from "axios";



export const appName = "Clash Stars Bot"
export const TelegramBot: string = "tem4ik_ru_bot"
export type userIdParam = number | string

export interface IPagination {
    totalCount: number
    maxPage: number
    currentPage: number
    limit: number
}

interface ITelegramUserInfo {
    username: string
    telegramId: string
    collectionUsernames: ICollectionUsername[]

}


export interface ICollectionUsername {
    id: string
    username: string,
    createdAt: string

}

export interface IScammer {
    id: string
    telegramId: string
    username?: string
    twinAccounts: ITelegramUserInfo[]
    collectionUsernames: ICollectionUsername[]
    registrationDate?: Date
    status: ScammerStatus
    scamForms: number
    marked: boolean
    createdAt: string
    description?: string
}

export interface IMedia {
    id: string
    fileId: string
    type: 'photo' | 'video'
    fileUrl?: string
}

export interface IScamForm {
    id: string
    description: string
    media: IMedia[]
    scammer: IScammer
    createdAt: string
    likes: number
    dislikes: number
}

export interface IVoteResponse {
    message: string
    isSuccess: boolean
    likes: number
    dislikes: number
    userVote: 'LIKE' | 'DISLIKE' | null
}

export interface ApiRoute {
    instance: AxiosInstance,
    baseUrl: Object
}

export interface IChatData {
    id: string
    username: string

    newUserMessage?: string
    rulesTelegramLink?: string
    showNewUserInfo: boolean

    autoMessageId?: string
    autoMessageIntervalSec?: number

    autoMessageKeyboardUrls?: string[]

    banUserFromChat?: boolean
    showUserBanMessage?: boolean

    banWords: string[]
}

export enum voteType {
    Like = 'LIKE',
    Dislike = 'DISLIKE'
}

export enum ScammerStatus {
    SCAMMER = 'SCAMMER',
    UNKNOWN = 'UNKNOWN',
    SUSPICIOUS = 'SUSPICIOUS',
    SPAMMER = 'SPAMMER'
}


export enum DepositType {
    STARS = 'STARS',
    CRYPTOBOT = 'CRYPTOBOT',
    TON = 'TON',    
    GIFTS = 'GIFTS'
}

export interface IGlobalConfig {
    tonRateInUsd: string // Цена покупки 1 TON в usd
    starRateInUsd: string // Цена покупки 1 звезды в usd
    starRateInTon: string // Цена покупки 1 звезды в ton

    referralPercent: string // Процент от прибыли для реферала (%)

    channelsToSubscribe: string[] // ["@channel1", "@channel2"]
    supportUsername: string | null // @username поддержки

    giftRateInTon: number // Цена покупки 1 звезды в ton

    /** Наценка на покупку подарка (в звёздах) */
    giftMarkupInStars?: number

    sellGiftCommissionPercent: number // Процент от продажи подарка

    /** Лидерборд: дата/время окончания сезона (ISO строка) */
    leaderboardSeasonEndAt?: string | null
    /** Звёзды за места 1–10 */
    leaderboardStarsByPlace?: number[] | null
}

export interface IGift {
    id: string
    giftId: string
    priceInStars: string
    title: string
    slug: string
    num: string
    model: string
    symbol: string
    backdrop: string
    modelRarityPermille?: number | null
    symbolRarityPermille?: number | null
    backdropRarityPermille?: number | null
    userId: string
    createdAt: string
    updatedAt: string
}

export const GIFT_IMAGE_BASE = "https://nft.fragment.com/gift"















