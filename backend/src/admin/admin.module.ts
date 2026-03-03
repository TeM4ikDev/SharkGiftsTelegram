import { DatabaseModule } from '@/database/database.module';
import { GiftModule } from '@/gift/gift.module';
import { TelegramModule } from '@/telegram/telegram.module';
import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserManagementController } from './controllers/user.controller';

import { TelegramClient } from '@/telegram/updates/TelegramClient';

@Module({
  imports: [
    DatabaseModule,
    HttpModule,
    ConfigModule,
    forwardRef(() => GiftModule),

    forwardRef(() => UsersModule),
    TelegramModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
 
   
  ],


  controllers: [
    AdminController,
    UserManagementController,

  ],
  providers: [
    AdminService,
    UserManagementController,
   
  ],
  exports: [AdminService, UserManagementController],
})
export class AdminModule { }
