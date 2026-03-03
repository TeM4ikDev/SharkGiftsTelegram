export interface IBoxesGameConfig {
    minBet: string;
    maxBet: string;
    multipliers: IBoxGameMultiplier[];
}


export interface IBoxGameMultiplier {
    multiplier: string;
    winChance: string;
}

export interface ISelectBoxResponse {
    isWin: boolean;
    newBank: number;
}




export interface IBoxesGame {
    id: string;
    bet: string;
    userId: string;
    isActive: boolean;
    level: number;
    multiplier: string;
    takeCashAmount: number | null;

    updatedAt: string;
    createdAt: string
}

export interface ICasesGameItem {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    
    starsChance: number;
    usdtChance: number;
    starsMin: number;
    starsMax: number;
    usdtMin: number;
    usdtMax: number;
}

export type ICasesGameItemResult = "STARS" | "USDT" | "GIFT" | "EMPTY";

export interface ICasesOpenResult {
    id: string;
    caseId: string;
    itemResult: ICasesGameItemResult;
    starsAmount: number | null;
    usdtAmount: number | null;
    animationType: number;
    checkCode: string | null;
}