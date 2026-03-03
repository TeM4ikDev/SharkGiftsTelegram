import { createAxiosInstance } from "@/api/axios.api";
import { ApiRoute } from "@/types";
import { apiConfig } from "@/types/pagesConfig";

export enum PremiumType {
  THREE_MONTHS = 'MONTHS_3',
  SIX_MONTHS = 'MONTHS_6',
  TWELVE_MONTHS = 'MONTHS_12',
}

export class giftService implements ApiRoute {
    instance;
    baseUrl;

    constructor() {
        this.instance = apiConfig.gift.baseInstance;
        this.baseUrl = apiConfig.gift;
    }

    async getGifts() {
        const { data } = await this.instance.get('');
        return data;
    }

    async getFeatured() {
        const { data } = await this.instance.get('featured');
        return data;
    }

    async getShopProducts() {
        const { data } = await this.instance.get('shop-products');
        return data;
    }

    async buyGift(giftId: string) {
        const { data } =  await this.instance.post(this.baseUrl.buyGift, { giftId });
        return data;
    }

    async buyPremium(premiumType: PremiumType) {
        const { data } = await this.instance.post(this.baseUrl.buyPremium, { premiumType });
        return data;
    }

    async buyShopProduct(productId: string, targetUsername?: string) {
        const { data } = await this.instance.post('buy-shop-product', { productId, targetUsername });
        return data;
    }

    async getMarketGift(link: string) {
        const { data } = await this.instance.get(`${this.baseUrl.getMarketGift}/${encodeURIComponent(link)}`);
        return data;
    }
}

export const GiftService = new giftService();
