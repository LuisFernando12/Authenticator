import { GenerateJTIPort } from '@/token/application/port/generate-jti.port';

export class GenerateUUIDFake implements GenerateJTIPort {
  generate(): string {
    return 'test-jti';
  }
}
