import { UserCheckMiddleware } from "@/auth/strategies/telegram.strategy";
import { DatabaseService } from "@/database/database.service";
import { UsersService } from "@/users/users.service";
import { UseGuards } from "@nestjs/common";
import { Command, Ctx, Update } from "nestjs-telegraf";
import { Context } from "telegraf";
import { Language } from "../decorators/language.decorator";
import { LocalizationService } from "../services/localization.service";
import { TelegramService } from "../telegram.service";
import { SCENES } from "../constants/telegram.constants";
import { SceneContext } from "telegraf/typings/scenes";

@UseGuards(UserCheckMiddleware)
@Update()
export class GarantsUpdate {
    constructor(
        private readonly database: DatabaseService,

        private readonly localizationService: LocalizationService,
        private readonly userService: UsersService,
        private readonly telegramService: TelegramService
    ) { }

    @Command('stat')
    async showStat(@Ctx() ctx: Context, @Language() lang: string) {
        // const stat = await this.userService.getTopUsersWithScamForms()

        // const message = stat.map((user, index) => {
        //     const number = index + 1
        //     const isUsername = user.username ? `[${user.firstName}](https://t.me/${user.username})` : user.firstName
        //     return `🔸 ${number}. ${isUsername} ${user.ScamForms.length}`
        // }).join('\n')

        // this.telegramService.replyWithAutoDelete(ctx, message, undefined, 30000)
    }

}