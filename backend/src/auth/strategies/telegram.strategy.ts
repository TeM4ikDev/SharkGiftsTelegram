// backend/src/telegram/middlewares/user-check.middleware.ts
import { DatabaseService } from '@/database/database.service';
import { UsersService } from '@/users/users.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Context } from 'telegraf';


@Injectable()
export class UserCheckMiddleware implements CanActivate {
    constructor(private readonly usersService: UsersService, private readonly database: DatabaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = context.switchToHttp().getRequest<Context>();

        // console.log('canActivate')

        const { user, isNew } = await this.usersService.findOrCreateUser(ctx.from);

        // Сохраняем isNew в контексте для использования в обработчиках
        (ctx as any).isNewUser = isNew;

        if (user.banned) {
            
        
            await ctx.reply(
               'У вас нет доступа к этому боту. Вы были забанены.', 
            );


            return false;
        }
        return true;
    }
}