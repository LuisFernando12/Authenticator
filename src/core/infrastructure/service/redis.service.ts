import { AppConfigEnvService } from '@/core/domain/service/app-config-env.service';
import { RedisService } from '@/core/domain/service/redis.service';
import { Redis } from 'ioredis';

export class RedisServiceImplement extends Redis implements RedisService {
  constructor(private readonly appConfigEnvService: AppConfigEnvService) {
    super(appConfigEnvService.redisURI);
    this.onModuleInit().catch((error) => {
      throw new Error(error);
    });
  }
  async onModuleInit() {
    this.info('RedisService initialized');
    await this.ping();
  }
  async onModuleDestroy() {
    this.info('RedisService destroyed');
    await this.quit();
  }
  async setOnRedis(
    key: string,
    value: string,
    expireInSeconds: number,
  ): Promise<string> {
    return await this.set(key, value, 'EX', expireInSeconds);
  }

  async getOnRedis(key: string): Promise<string | null> {
    return this.get(key);
  }

  async deleteFromRedis(key: string): Promise<void> {
    await this.del(key);
  }
  async getAndDeleteOnRedis(key: string): Promise<string | null> {
    const value = await this.getdel(key);
    return value;
  }
}
