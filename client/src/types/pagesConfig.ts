import { createAxiosInstance } from "@/api/axios.api";






class ApiConfig {
    auth = {
        baseInstance: createAxiosInstance('auth/'),
        profile: "profile",
        login: "login",
    }

    admin = {
        baseInstance: createAxiosInstance('admin/'),

        scamforms: {
            main: '/scamforms'
        },

        garants: {
            main: '/garants'
        },
        users: {
            main: "users",
            updateRole: "users/update-role",
            updateBanned: "users/update-banned",
            updateBalance: "users/update-balance",
            clearAllBalances: "users/clear-all-balances",
        },

        chatMessages: {
            main: "chatMessages",
            // addMessage: "chatMessages/addMessage"

        },
        settings: {
            main: "settings"
        }
    }

    game = {
        baseInstance: createAxiosInstance('game/'),
        selectBox: 'boxes/select-box',
        takeCash: 'boxes/take-cash',
        startBoxesGame: 'boxes/start',
        continueGame: 'boxes/continue-game',
        rouletteState: 'roulette/state',
        rouletteBet: 'roulette/bet',
        rouletteWithdraw: 'roulette/withdraw'



    }

    users = {
        baseInstance: createAxiosInstance('users/'),
        leaderboard: 'leaderboard',
        updateConfig: 'updateProfitConfig',
        balance: 'balance',
        deals: 'deals',
        profile: 'profile',
        topupBalance: 'topup-balance',
        getInvoiceLink: 'get-invoice-link',
        freeBonus: 'free-bonus',
        bonusInfo: 'bonus-info',
        depositHistory: 'deposits',
        applyPromocode: 'apply-promocode',
    }

    gift = {
        baseInstance: createAxiosInstance('gift/'),
        list: '',
        byId: (id: string) => id,

        getMarketGift: "market",

        buyPremium: 'buy-premium',
        buyGift: 'buy-gift',
    }

   
}


export const apiConfig = new ApiConfig()

