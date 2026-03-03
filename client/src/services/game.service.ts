import { IBoxesGame, IBoxesGameConfig, ICasesGameItem, ICasesOpenResult, ISelectBoxResponse } from "@/types/game";
import { apiConfig } from "@/types/pagesConfig";

class gameService {
    instance
    baseUrl

    constructor() {
        this.instance = apiConfig.game.baseInstance;
        this.baseUrl = apiConfig.game;
    }

    async getBoxesGameConfig(): Promise<{ config: IBoxesGameConfig, activeGame: IBoxesGame }> {
        const { data } = await this.instance.get(`boxes`)
        return data
    }

    async selectBox(): Promise<ISelectBoxResponse> {
        const { data } = await this.instance.post(this.baseUrl.selectBox)
        return data
    }

    async startBoxesGame(bet: number): Promise<IBoxesGame> {
        const { data } = await this.instance.post(this.baseUrl.startBoxesGame, { bet })
        return data
    }
    async continueGame(): Promise<IBoxesGame> {
        const { data } = await this.instance.post(this.baseUrl.continueGame)
        return data
    }

    async takeCash(amount: number): Promise<void> {
        const { data } = await this.instance.post(this.baseUrl.takeCash, { amount })
        return data
    }


    // __________________________

    async getCasesGame(): Promise<ICasesGameItem[]> {
        const { data } = await this.instance.get("cases")
        return data
    }

    async getCaseById(id: string) {
        const { data } = await this.instance.get(`cases/${id}`)
        return data
    }

    async openCase(caseId: string): Promise<ICasesOpenResult> {
        const { data } = await this.instance.post("cases/open", { caseId })
        return data
    }


    // __________________


    async getAssets() {
        const { data } = await this.instance.get("assets")
        return data
    }

    async getUserAssets() {
        const { data } = await this.instance.get("assets/me")
        return data
    }

    async buyAsset(assetId: string) {
        const { data } = await this.instance.post(`assets/buy`, { assetId })
        return data
    }

    async collectAssetsStars(): Promise<{ collectedStars: number, collectedFromAssets: number, balance: number }> {
        const { data } = await this.instance.post(`assets/collect-stars`)
        return data as { collectedStars: number, collectedFromAssets: number, balance: number }
    }
}


export const GameService = new gameService()