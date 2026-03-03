import { DatabaseService } from '@/database/database.service';
import { TelegramService } from '@/telegram/telegram.service';
import { UsersService } from '@/users/users.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import axios from 'axios';
import { portalGiftsData } from '../entities/gift.entity';

export interface PortalCollection {
    id: string;
    name: string;
    short_name: string;
    photo_url: string;
    is_premarket: boolean;
    is_crafted: boolean;
    created_at: string;
    day_volume: string;
    volume: string;
    floor_price: string;
    supply: number;
    listed_count: number;
    sales_24h_count: number;
    market_cap: string;
}

export interface PortalsApiResponse {
    collections: PortalCollection[];
    floor_changes: Record<string, string>;
    volume_changes: Record<string, string>;
}


@Injectable()
export class PortalsGiftsService {
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly database: DatabaseService,
        @Inject(forwardRef(() => TelegramService))
        private readonly telegramService: TelegramService

    ) { }

    // async getGiftsCollections() {
    //     const globalConfig = this.telegramService.getGlobalConfig();
    //     console.log('globalConfig getGiftsCollections', globalConfig);
    //     if (!globalConfig) throw new Error('Global config not found');

    //     const authPortalData = globalConfig.authPortalData;

    //     try {
    //         const url = `https://portal-market.com/api/collections?limit=150&offset=0&favorites_only=false`;

    //         const response = await axios.get<PortalsApiResponse>(url, {
    //             headers: {
    //                 'Authorization': authPortalData,
    //                 'Accept': 'application/json',
    //                 "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    //             }
    //         });

    //         const collections = response.data.collections;

    //         const mappedCollections = collections.map(collection => ({
    //             market_id: collection.id,
    //             name: collection.name,
    //             short_name: collection.short_name,
    //             photo_url: collection.photo_url,
    //             floor_price: Number(collection.floor_price),
    //             supply: collection.supply,
    //         }));


    //         // console.log(mappedCollections);
    //         return mappedCollections;


    //     } catch (error: any) {
    //         console.error('Ошибка при получении данных с Portals API', error);
    //         return
    //     }

    // }

    async getGiftsCollections() {
        return portalGiftsData.collections.map(collection => ({
            market_id: collection.id,
            name: collection.name,
            short_name: collection.short_name,
            photo_url: collection.photo_url,
            floor_price: Number(collection.floor_price),
            supply: collection.supply,
        }));
    }

}


