import { apiConfig } from "@/types/pagesConfig";

export type RouletteRoundParticipant = {
    userId: string;
    username: string;
    betAmount: number;
    isWinner: boolean;
    payout: number;
    winChance: number;
};

export type RouletteRoundHistoryItem = {
    id: string;
    roundNumber: number;
    winnerUsername: string | null;
    winnerGain: number;
    commission: number;
    totalBank: number;
    createdAt: string;
    participants: RouletteRoundParticipant[];
};

class RouletteService {
    private instance = apiConfig.game.baseInstance;

    async getState() {
        const { data } = await this.instance.get("roulette/state");
        return data;
    }

    async placeBet(amount: number) {
        const { data } = await this.instance.post("roulette/bet", { amount });
        return data;
    }

    async withdrawBet() {
        const { data } = await this.instance.post("roulette/withdraw");
        return data;
    }

    async getHistory() {
        const { data } = await this.instance.get("roulette/history");
        return data as RouletteRoundHistoryItem[];
    }
}

export const rouletteService = new RouletteService();
