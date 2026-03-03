import { DatabaseService } from '@/database/database.service';
import { Public, Roles } from '@/decorators/roles.decorator';
import { BadRequestException, Body, Controller, Delete, forwardRef, Get, Inject, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRoles, DepositType } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/strategies/roles.strategy';
import { UsersService } from 'src/users/users.service';
import { AdminService } from './admin.service';
import { CreatePromoCodeDto } from './dto/create-promocode.dto';
import { CreateShopProductDto, UpdateShopProductDto } from './dto/shop-product.dto';
import { IDashboardQuery } from './dto/dashboard-dto';
import { TelegramClient } from '@/telegram/updates/TelegramClient';
import { TelegramModule } from '@/telegram/telegram.module';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.SUPER_ADMIN)
export class AdminController {
  constructor(
    // private readonly usersService: UsersService,
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly database: DatabaseService,

    @Inject(forwardRef(() => TelegramClient)) // Верните это, если есть циклическая зависимость
    private readonly telegramClient: TelegramClient,
  ) { }

  private readonly email = "admin@admin.com";
  private readonly password = "admin";


  @Public()
  @Post("login")
  async login(@Body() body: { email?: string; username?: string; password: string }) {
    console.log(body)
    const email = body.email || body.username;

    if (!email || !body.password) {
      throw new UnauthorizedException("Email/username and password are required");
    }

    if (email !== this.email || body.password !== this.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.jwtService.sign({
      id: "admin",
      email: this.email,
      role: UserRoles.SUPER_ADMIN,

    });

    return {
      token,
      user: {
        id: "admin",
        email: this.email,
        name: "Admin",
        role: UserRoles.SUPER_ADMIN,
      }
    };
  }


  @Get('profile')
  async getProfile(@Req() req: { user?: { email?: string } }) {
    return {
      id: "admin",
      email: req.user?.email || this.email,
      name: "Admin",
    };
  }


  @Post("game-analytics/boxes/settings")
  async updateBoxSettings(@Body() body: any) {
    console.log(body)
    return await this.adminService.updateGlobalConfig(body);
  }
  
  // ________
  @Get('settings')
  async getSettings() {
    return await this.adminService.getGlobalConfig();
  }

  @Patch('settings')
  async updateSettings(@Body() body: any) {
    // Преобразуем channelsToSubscribe из массива строк в JSON
    const updateData: any = { ...body };
    if (body.channelsToSubscribe && Array.isArray(body.channelsToSubscribe)) {
      updateData.channelsToSubscribe = body.channelsToSubscribe;
    }
    return await this.adminService.updateGlobalConfig(updateData);
  }

 

  @Get('deposits')
  async getDeposits(
    @Query() query: { page?: number; limit?: number; type?: DepositType; search?: string; startDate?: string; endDate?: string },
  ) {
    const page = Math.max(0, Number(query.page) || 0);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { user: { telegramId: { contains: search } } },
        { user: { username: { contains: search } } },
        { user: { firstName: { contains: search } } },
      ];
      if (/^\d+$/.test(search)) {
        where.OR.push({ user: { telegramId: search } });
      }
    }

    const [data, total] = await Promise.all([
      this.database.deposit.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          ton: true,
          cryptoBot: true,
          stars: true,
        },
      }),
      this.database.deposit.count({ where }),
    ]);
    return { data, total };
  }

 
 

 

  @Get('shop/gifts')
  async getShopGifts() {
    // return await this.adminService.getShopGifts();
  }

  @Patch('shop/gifts/:id')
  async updateShopGift(@Param('id') id: string, @Body() body: { priceInStars?: number }) {
    // return await this.adminService.updateShopGift(id, body);
  }

  

  

 

 
}
