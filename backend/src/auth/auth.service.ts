import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { DatabaseService } from '@/database/database.service';
import { UsersService } from '@/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  private readonly encryptionKey: Buffer;
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY is not set. Set it in .env or in Docker environment (e.g. env_file: backend/.env.production).',
      );
    }
    this.encryptionKey = Buffer.from(key, 'base64');
  }
  
  async login(user: any) {
    const { id, telegramId, firstName, username, role, hasAccess, hasGlobalMessages } = user;
    return {
      user,
      token: this.jwtService.sign({ id, telegramId, username, role, hasAccess, hasGlobalMessages }),
    };
  }


  async handleExistingUser(user, organization) {
    if (user.banned) throw new UnauthorizedException('You are banned')
    return { verified: true };
  }
}
