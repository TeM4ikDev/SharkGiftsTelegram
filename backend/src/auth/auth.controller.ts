import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
	Request,
	UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
	UsersService,
} from 'src/users/users.service';
import { User } from 'telegraf/typings/core/types/typegram';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserAuthParams } from 'telegram/client/auth';
import { ITgUser } from '@/types/types';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { validateTelegramWebAppData } from './utils/telegram-webapp-validator';
import { ConfigService } from '@nestjs/config';



@Controller('auth')
export class AuthController {
	constructor(
		protected readonly authService: AuthService,
		protected readonly usersService: UsersService,
		protected readonly jwtService: JwtService,
		protected readonly configService: ConfigService,
	) { }



	@Get('profile')
	@UseGuards(JwtAuthGuard)
	async getProfile(@Request() req) {
		return req.user;
	}


	@Post('/login')
	async login(
		@Body() loginDto: TelegramLoginDto,
	) {
		const botToken = this.configService.get<string>('BOT_TOKEN');
		if (!botToken) {
			throw new BadRequestException('Bot token not configured');
		}

		const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
		const allowMockData = this.configService.get<string>('ALLOW_MOCK_TELEGRAM_DATA') === 'true';

		console.log("isDevelopment", isDevelopment)

		let telegramUser: User;

		// В режиме разработки с разрешенным mockData пропускаем валидацию
		if (isDevelopment && allowMockData && loginDto.initData.includes('mock_hash_for_dev')) {
			try {
				// Извлекаем данные пользователя из mock initData без валидации подписи
				const urlParams = new URLSearchParams(loginDto.initData);
				const userParam = urlParams.get('user');
				if (userParam) {
					telegramUser = JSON.parse(decodeURIComponent(userParam)) as User;
				} else {
					throw new BadRequestException('Invalid mock data format');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				throw new BadRequestException(`Invalid mock Telegram data: ${errorMessage}`);
			}
		} else {
			// В продакшене всегда валидируем подпись
			try {
				// Валидируем и извлекаем данные пользователя из initData
				telegramUser = validateTelegramWebAppData(loginDto.initData, botToken) as User;
			} catch (error) {
				// Улучшенная обработка ошибок
				if (error instanceof BadRequestException) {
					throw error;
				}
				const errorMessage = error instanceof Error ? error.message : String(error);
				throw new BadRequestException(`Invalid Telegram data: ${errorMessage}`);
			}
		}

		if (!telegramUser || !telegramUser.id) {
			throw new BadRequestException('Invalid user data');
		}

		const { user, isNew } = await this.usersService.findOrCreateUser(telegramUser);

		if (!user) {
			throw new BadRequestException('User not found');
		}

		return await this.authService.login(user);
	}



}




