import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';

import { AdminService } from './admin/admin.service';
import { PaymentModule } from './payment/payment.module';
import { TelegramModule } from './telegram/telegram.module';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';

// import { AdminModule as AdminModuleNest } from '@adminjs/nestjs';
import { UserRoles } from '@prisma/client';
import { CronModule } from './cron/cron.module';
import { GiftModule } from './gift/gift.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Сначала режим (development/production), затем общий .env для переопределения
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ].filter(Boolean),
      ignoreEnvFile: false, // в продакшене можно не иметь файлов — переменные из Docker/хоста
    }),
    // AdminModuleNest.createAdminAsync({
    //   inject: [DatabaseService],
    //   useFactory: (databaseService: DatabaseService) => ({
    //     adminJsOptions: {
    //       rootPath: '/admin', 
    //       resources: [
    //         {
    //           resource: { 
    //             model: (databaseService as any)._dmmf.modelMap.User, 
    //             client: databaseService 
    //           },
    //           options: {},
    //         },
    //         // Добавьте другие модели (Transaction, BotConfig и т.д.) так же
    //       ],
    //     },
    //   }),
    // }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    AuthModule,
    AdminModule,
    TelegramModule,
    UsersModule,
    PaymentModule,
    CronModule,
    GiftModule,


  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
  exports: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
    private readonly adminService: AdminService
  ) { }


  async onCreateAdmin() {

    const existingAdmin = await this.databaseService.user.findUnique({
      where: {
        telegramId: "admin",
      }
    })
    if (existingAdmin) {
      return
    }

    console.log("Creating admin...")

    await this.databaseService.user.create({
      data: {
        id: "admin",
        telegramId: "admin",
        firstName: "Admin",
        lastName: "",
        username: "admin@admin.com",
        role: UserRoles.SUPER_ADMIN,
      }
    })
  }

  async onModuleInit() {
    this.adminService.findOrCreateGlobalConfig()
    this.onCreateAdmin()

    // полная очистка базы данных
    // await this.cleanDatabase();
  }

  async cleanDatabase() {
    // await this.databaseService.scamForm.deleteMany();
    // await this.databaseService.media.deleteMany();
    // await this.databaseService.usersConfig.deleteMany();
    // await this.databaseService.user.deleteMany();
    // await this.databaseService.chatConfig.deleteMany();
  }



}
