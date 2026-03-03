import { AdminService } from '@/admin/admin.service';
import { DatabaseService } from '@/database/database.service';
import { PortalsGiftsService } from '@/gift/services/portal-gifts.service';
import { TelegramService } from '@/telegram/telegram.service';
import { TelegramClient } from '@/telegram/updates/TelegramClient';
import { MAX_ACCUMULATION_MS } from '@/types/constants';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';



@Injectable()
export class CronService implements OnModuleInit {
    private readonly notifiedFullUsers = new Set<string>();

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly telegramService: TelegramService,
        private readonly telegramClient: TelegramClient,
        private readonly portalsGiftsService: PortalsGiftsService,
        private readonly adminsService: AdminService,
    ) { }


    async onModuleInit() {
        // await this.updateGlobalConfig();
    }


    @Cron("*/30 * * * * *")
    async updateGlobalConfig() {
        try {
            this.telegramService.setGlobalConfig(await this.adminsService.onUpdateGlobalConfigRate());
        } catch (error) {
            console.error('Ошибка при обновлении глобальной конфигурации:', error);
        }
    }

   
}
