import { DatabaseService } from '@/database/database.service';
import { TelegramClient } from '@/telegram/updates/TelegramClient';
import { superAdminsTelegramIds } from '@/types/types';
import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { DepositType, Prisma, UserLanguage, UserRoles } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { User } from 'telegraf/typings/core/types/typegram';


@Injectable()
export class UsersService {
  constructor(
    private database: DatabaseService,
    @Inject(forwardRef(() => TelegramClient))
    private telegramClient: TelegramClient) { }


  async findUsersConfig() {
    return await this.database.usersConfig.findMany()
  }

  async findAllUsers(page: number = 1, limit: number = 10, search: string = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? {
        OR: [
          { username: { contains: search } },
          { telegramId: { contains: search } }
        ]
      }
      : undefined;



    const [users, totalCount] = await Promise.all([
      this.database.user.findMany({
        skip,
        take: limit,
        orderBy: [
          { role: 'asc' },
        ],
        where,
      }),
      this.database.user.count({ where }),
    ]);
    const maxPage = Math.ceil(totalCount / limit);
    return {
      users,
      pagination: {
        totalCount,
        maxPage,
        currentPage: page,
        limit,
      },
    };
  }


  private getCurrentRouletteSeasonBounds(now = new Date()) {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const utcMidnightNow = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    );
    const utcDayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday
    const daysFromMonday = (utcDayOfWeek + 6) % 7;
    const seasonStartMs = utcMidnightNow - daysFromMonday * DAY_MS;
    const seasonEndMs = seasonStartMs + 7 * DAY_MS;

    return {
      seasonStartAt: new Date(seasonStartMs),
      seasonEndAt: new Date(seasonEndMs),
    };
  }

 

  async findUserById(userId: string) {
    return await this.database.user.findUnique({
      where: { id: userId },
      include: {
        UsersConfig: true,
      }
    });
  }

  async getUserBalanceAmount(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: {
        balance: true
      }
    })
    return user?.balance || null;
  }

  async updateUser(userId: string, data: any) {
    return await this.database.user.update({
      where: { id: userId },
      data: data
    });
  }

  async addUserBalance(userId: string, amount: Decimal, tx?: Prisma.TransactionClient) {
    const db = tx || this.database;
    const newUserBalance = await db.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } }
    });
    return newUserBalance.balance;
  }

  async updateUserBalance(userId: string, amount: Decimal, tx?: Prisma.TransactionClient) {
    const db = tx || this.database;
    return await db.user.update({
      where: {
        id: userId
      },
      data: {
        balance: amount
      }
    })
  }

 
  

  async clearAllBalances() {
    const result = await this.database.user.updateMany({
      data: {
        balance: new Decimal(0)
      }
    });
    return { count: result.count };
  }

  async findUserByTelegramId(telegramId: string) {


    return await this.database.user.findUnique({
      where: {
        telegramId: telegramId
      },
      include: {
        UsersConfig: true,

      }

    }) || null
  }

  async findUsersByRole(role: UserRoles) {
    return await this.database.user.findMany({
      where: {
        role
      }
    })
  }

  async findOrCreateUser(createUserDto: User & { photo_url?: string }): Promise<{ user: any; isNew: boolean }> {
    const { id, last_name, first_name, username, photo_url } = createUserDto

    const existingUser = await this.findUserByTelegramId(String(id))

    if (existingUser) {
      if (superAdminsTelegramIds.includes(existingUser.telegramId)) {
        const updatedUser = await this.database.user.update({
          where: {
            telegramId: existingUser.telegramId
          },
          data: {
            role: UserRoles.SUPER_ADMIN,
          },
        });
        return { user: updatedUser, isNew: false };
      }
      return { user: existingUser, isNew: false };
    }



    const newUser = await this.database.user.create({
      data: {
        telegramId: String(id),
        firstName: first_name,
        lastName: last_name,
        username: username,
        photo_url: photo_url,
        UsersConfig: {
          create: {}
        }
      }
    });

    return { user: newUser, isNew: true };
  }

  async findUserByUsername(username: string) {
    return await this.database.user.findFirst({
      where: { username },
      include: { UsersConfig: true }
    });
  }


  async updateUserRights(telegramId: string) {
    const user = await this.findUserByTelegramId(telegramId);

    const updatedUser = await this.database.user.update({
      where: {
        telegramId,
      },
      data: {
        role: user.role == UserRoles.USER ? UserRoles.ADMIN : UserRoles.USER
      }
    });

    return updatedUser;
  }

  async updateUserRole(telegramId: string, role: UserRoles) {
    const user = await this.findUserByTelegramId(telegramId);
    // const userById = await this.findUserByTelegramId(telegramId);

    if (!user) throw new Error('Пользователь не найден');
    return await this.database.user.update({
      where: { id: user.id },
      data: { role: role }
    });
  }

  async updateUserBanned(userId: string, banned: boolean) {
    return await this.database.user.update({
      where: { id: userId },
      data: { banned },
    })
  }

  async setUserLanguage(telegramId: string, language: UserLanguage) {
    const user = await this.findUserByTelegramId(telegramId);
    if (!user) throw new Error('Пользователь не найден');


    console.log(language)
    return this.database.usersConfig.update({
      where: { userId: user.id },
      data: { language },
    });
  }



  async setAdminRole(telegramId: string) {
    return await this.database.user.update({
      where: { telegramId },
      data: { role: UserRoles.ADMIN }
    });
  }

  async removeAdminRole(telegramId: string) {
    return await this.database.user.update({
      where: { telegramId },
      data: { role: UserRoles.USER }
    });
  }

  async updateUsernameByTelegramId(telegramId: string, username: string) {
    return await this.database.user.update({
      where: { telegramId },
      data: { username }
    });
  }

  // async getUserDeposits(
  //   userId: string,
  //   opts?: { type?: DepositType; page?: number; limit?: number },
  // ) {
  //   const page = Math.max(1, Number(opts?.page) || 1);
  //   const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 20));
  //   const skip = (page - 1) * limit;

  
  //   const where: Prisma.DepositWhereInput = { userId };
  //   if (opts?.type && typeof opts.type === 'string') {
  //     where.type = opts.type as DepositType;
  //   }

  //   const [data, total] = await Promise.all([
  //     this.database.deposit.findMany({
  //       where,
  //       orderBy: { createdAt: 'desc' },
  //       skip,
  //       take: limit,
  //       include: {
  //         stars: true,
  //         ton: true,
  //         cryptoBot: true,
  //       },
  //     }),
  //     this.database.deposit.count({ where }),
  //   ]);

  //   return {
  //     data: data.map((d) => ({
  //       id: d.id,
  //       userId: d.userId,
  //       amountInStars: d.amountInStars != null ? Number(d.amountInStars) : null,
  //       status: d.status,
  //       type: d.type,
  //       createdAt: d.createdAt,
  //       updatedAt: d.updatedAt,
  //       stars: d.stars,
  //       ton: d.ton,
  //       cryptoBot: d.cryptoBot,
  //     })),
  //     total,
  //     page,
  //     limit,
  //   };
  // }
}






