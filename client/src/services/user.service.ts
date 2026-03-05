import { createAxiosInstance } from "@/api/axios.api";
import { ApiRoute, DepositType } from "@/types";
import { apiConfig } from "@/types/pagesConfig";


export class userService implements ApiRoute {
    instance;
    baseUrl;

    constructor() {
        this.instance = apiConfig.users.baseInstance;
        this.baseUrl = apiConfig.users;
    }

    async updateUserData(userConfig: any) {
        const { data } = await this.instance.patch('', userConfig)
        return data
    }

    async getUserDeals() {
        const { data } = await this.instance.get(this.baseUrl.deals)
        return data
    }


    async getUserProfile() {
        const { data } = await this.instance.get(this.baseUrl.profile)
        return data
    }

    async getUserBalance(): Promise<string> {
        const { data } = await this.instance.get(this.baseUrl.balance)
        return data
    }

    async topupBalance(paymentMethod: string, amount: number) {
        const { data } = await this.instance.post(this.baseUrl.topupBalance, { paymentMethod, amount })
        return data
    }

    async getInvoiceLink(dataS: any, paymentMethod: string) {
        const { data } = await createAxiosInstance('payment/').post('/get-invoice-link', { ...dataS, paymentMethod })
        return data
    }

    async sendDepositData({ boc, giftId, username, giftAmount, amountInStars, amountInTon, memo, message }: { boc: string, username: string, giftId: string, giftAmount: number, amountInStars: number, amountInTon: number, memo: string, message?: string }) {
        const { data } = await createAxiosInstance('payment/').post('/send-deposit-data', { boc, username, giftId, giftAmount, amountInStars, amountInTon, memo, message })
        return data
    }

    async getLeaderboard({ limit, page, mode }: { limit: number, page: number, mode?: 'balance' | 'rouletteWins' }) {
        const { data } = await this.instance.get(this.baseUrl.leaderboard, { params: { limit, page, mode } })
        return data
    }

    async getBonusInfo() {
        const { data } = await this.instance.get(this.baseUrl.bonusInfo)
        return data
    }

    async getFreeBonus() {
        const { data } = await this.instance.get(this.baseUrl.freeBonus)
        return data
    }

    async getDepositHistory(type: DepositType, limit: number, page: number) {
        const { data } = await this.instance.get(this.baseUrl.depositHistory, { params: { type, limit, page } })
        return data
    }

    async applyPromocode(promocode: string) {
        const { data } = await this.instance.post(this.baseUrl.applyPromocode, { promocode })
        return data
    }


    async getUserTelegramData(n: string){
        const { data } = await this.instance.post(this.baseUrl.getTgUser, { n })
        return data
    }
}


export const UserService = new userService()