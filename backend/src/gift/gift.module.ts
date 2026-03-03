import { DatabaseModule } from '@/database/database.module';
import { TelegramModule } from '@/telegram/telegram.module';
import { UsersModule } from '@/users/users.module';
import { forwardRef, Module } from '@nestjs/common';
import { GiftController } from './gift.controller';
import { GiftService } from './gift.service';
import { PortalsGiftsService } from './services/portal-gifts.service';
import { FragmentApiService } from '@/payment/services/fragment.api.service';
import { PaymentModule } from '@/payment/payment.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => TelegramModule),
    DatabaseModule,

    PaymentModule
  ],
  controllers: [GiftController],
  providers: [GiftService, PortalsGiftsService],
  exports: [GiftService, PortalsGiftsService],
})
export class GiftModule {}
