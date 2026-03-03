import { Roles } from '@/decorators/roles.decorator';
import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRoles } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/strategies/roles.strategy';
import { UsersService } from 'src/users/users.service';
import { AdminService } from '../admin.service';


@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.SUPER_ADMIN)
export class UserManagementController {
    constructor(
        private readonly usersService: UsersService,
        private readonly adminService: AdminService,
    ) { }

    @Get()
    async findAllUsers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search: string = ''
    ) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        return await this.usersService.findAllUsers(pageNum, limitNum, search);
    }

    // @Get(":id")
    // async getUserDetails(@Param('id') userId: string) {
    //     const user = await this.usersService.findUserById(userId);
    //     return await this.usersService.getUserDetailedProfile(user.telegramId)
    // }

    @Patch('update-role')
    async updateUserRole(@Body() body: { userId: string, role: UserRoles }) {
        console.log(body)
        return await this.usersService.updateUserRole(body.userId, body.role)
    }


    @Patch('update-banned')
    async updateUserBanned(@Body() body: { userId: string, banned: boolean }) {
        console.log(body)
        return await this.usersService.updateUserBanned(body.userId, body.banned)
    }


    @Patch('update-balance')
    async updateUserBalance(@Body() body: { userId: string, balance: number }) {
        console.log(body)

        return await this.usersService.updateUserBalance(body.userId, new Decimal(body.balance))
    }

   

}

