import { ITelegramAuth, ITelegramUser, IUser } from "@/types/auth";
import { apiConfig } from "@/types/pagesConfig";
import { WebAppInitData } from "@twa-dev/types";

class authService {
    instance
    baseUrl

    constructor() {
        this.instance = apiConfig.auth.baseInstance;
        this.baseUrl = apiConfig.auth;
    }

    async login(loginData: { initData: string }) {
        const { data } = await this.instance.post(this.baseUrl.login, loginData)
        return data
    }
    
    async getProfile(): Promise<IUser | null> {
        try {
            const { data } = await this.instance.get(this.baseUrl.profile)
            return data;
        } catch (error) {
            return null;
        }
    }
}


export const AuthService = new authService()