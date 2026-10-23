import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from '../../../user/infrastructure/module/user.module';
import { USER_REPOSITORY_PORT } from '../../application/port/user-repository.port';
import { UserRepositoryAdapter } from '../adapter/user-repository.adapter';
import { AuthGuard } from '../guard/auth.guard';
import { RedisModule } from './redis.module';

@Module({
  imports: [UserModule, RedisModule],
  providers: [
    { provide: USER_REPOSITORY_PORT, useClass: UserRepositoryAdapter },
    AuthGuard,
    JwtService,
  ],
  exports: [AuthGuard, JwtService, USER_REPOSITORY_PORT],
})
export class AuthGuardModule {}
