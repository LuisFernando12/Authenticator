import { randomUUID } from 'node:crypto';
import { GenerateJTIPort } from '../../application/port/generate-jti.port';

export class GenerateJTIAdapter implements GenerateJTIPort {
  generate(): string {
    return randomUUID();
  }
}
