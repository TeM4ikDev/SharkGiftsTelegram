import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { DatabaseService } from '@/database/database.service';
import { UserId } from '@/decorators/userid.decorator';
import { TelegramService } from '@/telegram/telegram.service';
import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { DepositType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { UsersService } from './users.service';
import { BONUS_AMOUNT, bonusDuration, CHANNELS } from '@/types/constants';
import { TelegramClient } from '@/telegram/updates/TelegramClient';
// import { PartialType, PickType } from '@nestjs/swagger';

export interface IUpdateUserData {
  successfulDeals: number;
}


@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
    private readonly telegramService: TelegramService,
    private readonly telegramClient: TelegramClient
  ) { }

  @Get("balance")
  async getBalance(@UserId() userId: string) {
    return await this.usersService.getUserBalanceAmount(userId);

  }

  @Get('profile')
  async getUserDetails(@UserId() userId: string) {

    console.log(userId)

    // return await this.usersService
    return await this.usersService.findUserById(userId)
  }

  @Get('deposits')
  async getDeposits(
    @UserId() userId: string,
    @Query() query: { type?: "STARS" | "CRYPTOBOT" | "TON"; page?: number; limit?: number },
  ) {

    console.log(query)
    // return await this.usersService.getUserDeposits(userId, {
    //   type: query.type,
    //   page: query.page,
    //   limit: query.limit,
    // });
  }



  @Post("getTgUser")
  async getU(@Body() body) {
    console.log(body)
    const res = await this.telegramClient.getUserData(body.n)
    console.log(res, 'res')
    return res


  }


}
