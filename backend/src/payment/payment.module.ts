import { DatabaseModule } from '@/database/database.module';
import { TelegramModule } from '@/telegram/telegram.module';
import { UsersModule } from '@/users/users.module';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { FragmentApiService } from './services/fragment.api.service';
import { PaymentPollingService } from './services/payment-polling.service';
import { PlategaService } from './services/platega.service';
import { TonApiService } from './services/ton-api.service';

@Module({ 
  imports: [
    ConfigModule,
    DatabaseModule,
   
   
    forwardRef(() => UsersModule),
    forwardRef(() => TelegramModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, TonApiService, PaymentPollingService, FragmentApiService, PlategaService],
  exports: [PaymentService, FragmentApiService, TonApiService, PlategaService],
})
export class PaymentModule {}

