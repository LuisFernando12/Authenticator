export const REDIS_SERVICE_PORT = Symbol('REDIS_SERVICE_PORT');
export abstract class RedisService {
  abstract onModuleInit();
  abstract onModuleDestroy();
  abstract setOnRedis(
    key: string,
    value: string,
    expireInSeconds: number,
  ): Promise<string>;
  abstract getOnRedis(key: string): Promise<string | null>;
  abstract deleteFromRedis(key: string): Promise<void>;
  abstract getAndDeleteOnRedis(key: string): Promise<string | null>;
}
