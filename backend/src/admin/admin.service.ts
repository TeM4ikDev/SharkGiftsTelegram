import { DatabaseService } from '@/database/database.service';
import { PortalsGiftsService } from '@/gift/services/portal-gifts.service';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private readonly database: DatabaseService,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => PortalsGiftsService))
        private readonly portalsGiftsService: PortalsGiftsService,
    ) { }

    onModuleInit() {
        this.findOrCreateGlobalConfig()
    }

    async getGlobalConfig() {
        return await this.database.globalConfig.findFirst({
            
        }) || null
    }

   
  
    
    // _____________________________

    private toDecimal(value: unknown, fieldName: string): Decimal {
        if (value instanceof Decimal) return value;
        if (typeof value === "number") {
            if (!Number.isFinite(value)) throw new BadRequestException(`Некорректное значение для ${fieldName}`);
            return new Decimal(value);
        }
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed) throw new BadRequestException(`Пустое значение для ${fieldName}`);
            const num = Number(trimmed);
            if (!Number.isFinite(num)) throw new BadRequestException(`Некорректное значение для ${fieldName}`);
            return new Decimal(trimmed);
        }
        throw new BadRequestException(`Некорректный тип для ${fieldName}`);
    }

    private toInt(value: unknown, fieldName: string): number {
        const num = typeof value === "string" ? Number(value.trim()) : Number(value);
        if (!Number.isFinite(num)) throw new BadRequestException(`Некорректное значение для ${fieldName}`);
        return Math.trunc(num);
    }

    private buildGlobalConfigUpdate(data: any): Prisma.GlobalConfigUpdateInput {
        const updateData: Prisma.GlobalConfigUpdateInput = {};

        if (data?.tonRateInUsd !== undefined) {
            updateData.tonRateInUsd = this.toDecimal(data.tonRateInUsd, "tonRateInUsd");
        }
        if (data?.starRateInUsd !== undefined) {
            updateData.starRateInUsd = this.toDecimal(data.starRateInUsd, "starRateInUsd");
        }
        if (data?.starRateInTon !== undefined) {
            updateData.starRateInTon = this.toDecimal(data.starRateInTon, "starRateInTon");
        }
        if (data?.giftMarkupInStars !== undefined) {
            const v = this.toInt(data.giftMarkupInStars, "giftMarkupInStars");
            if (v < 0) throw new BadRequestException("giftMarkupInStars не может быть отрицательной");
            updateData.giftMarkupInStars = v;
        }

        if (data?.channelsToSubscribe !== undefined) {
            // Prisma Json поле — можно принимать массив строк как есть
            updateData.channelsToSubscribe = data.channelsToSubscribe as any;
        }
        if (data?.supportUsername !== undefined) {
            updateData.supportUsername = (typeof data.supportUsername === "string" ? data.supportUsername.replace("@", "") : data.supportUsername) || null;
        }
        if (data?.authPortalData !== undefined) {
            updateData.authPortalData = data.authPortalData ?? null;
        }

        return updateData;
    }

    async updateGlobalConfig(data: any) {
        const updateData = this.buildGlobalConfigUpdate(data);
        return await this.database.globalConfig.update({
            where: { id: 1 },
            data: updateData,
        });
    }

    async onUpdateGlobalConfigRate() {
        const existingConfig = await this.database.globalConfig.findFirst()

        if (!existingConfig) {
            this.logger.error("Global config doesn't exists")
            return
        }

        const tonRateInUsd = await this.getTonToUsdRate()
        if (!tonRateInUsd) return;

        // 1 ⭐ = starRateInUsd USDT, 1 TON = tonRateInUsd USDT => 1 ⭐ = starRateInUsd / tonRateInUsd TON
        const starRateInUsd = existingConfig.starRateInUsd ?? new Decimal("0.015");
        const starRateInTon = starRateInUsd.div(tonRateInUsd);

        // const giftsCollections = await this.portalsGiftsService.getGiftsCollections()
        // this.logger.debug(`giftsCollections: ${giftsCollections?.length}`)
        // if (giftsCollections) {
        //     // await this.database.portalCollection.deleteMany({
        //     //     where: {
        //     //         globalConfigId: 1,
        //     //     }
        //     // })

        //     // await this.database.portalCollection.createMany({
        //     //     data: giftsCollections.map(collection => ({
        //     //         globalConfigId: 1,
        //     //         ...collection
        //     //     }))
        //     // })
        // }


        return await this.updateGlobalConfig({ tonRateInUsd, starRateInTon })

    }

    async findOrCreateGlobalConfig() {
        const existingConfig = await this.database.globalConfig.findFirst()

        if (existingConfig) return

        const tonRateInUsd = await this.getTonToUsdRate()

        await this.database.globalConfig.create({
            data: {
                starRateInUsd: new Decimal("0.015"),
                starRateInTon: (tonRateInUsd ? new Decimal("0.015").div(tonRateInUsd) : new Decimal("0.01")),
                tonRateInUsd: tonRateInUsd || new Decimal(0),
                giftMarkupInStars: 0,

            
            }
        })

        // await this.createAssets();
    }


    async getTonToUsdRate(): Promise<Decimal | null> {
        try {
            // Пробуем получить через CMC
            // const cmcRates = await this.getRatesFromCMC();
            // return new Decimal(cmcRates.tonToUsd);


            // Резервный вариант через Bybit
            const tonUsdtResponse = await firstValueFrom(
                this.httpService.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=TONUSDT', {
                    timeout: 5000
                })
            );
            const tonUsdtPrice = parseFloat(tonUsdtResponse.data?.result?.list?.[0]?.lastPrice);

            if (!tonUsdtPrice || isNaN(tonUsdtPrice)) {
                throw new Error('Неверный формат ответа от Bybit API');
            }

            return new Decimal(tonUsdtPrice);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Ошибка при получении курса TON/USD: ${errorMessage}`);
            return null;
        }
    }

   

   
}
