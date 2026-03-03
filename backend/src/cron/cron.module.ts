import { AdminModule } from '@/admin/admin.module';
import { DatabaseModule } from '@/database/database.module';
import { GiftModule } from '@/gift/gift.module';
import { TelegramModule } from '@/telegram/telegram.module';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { CronService } from './cron.service';

@Module({
  imports: [DatabaseModule, TelegramModule, UsersModule, GiftModule, AdminModule],
  controllers: [],
  providers: [CronService],
})
export class CronModule {}
