import { HttpExceptionFilter } from '@/config/filters/http-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './module/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    },
  });
  const trustProxy = Number(process.env.TRUST_PROXY ?? '0');
  if (trustProxy) app.set('trust proxy', trustProxy);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api/auth');
  app.useGlobalFilters(new HttpExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle('Authenticator API')
    .setDescription('API documentation for the Authenticator service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory());
  const logger = new Logger('Swagger API Docs');
  logger.log(
    `Swagger API Docs available at http://localhost:${process.env.PORT || 3000}/api/docs`,
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
