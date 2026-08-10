import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NotFoundExceptionFilter } from './web-api/commons/filters/not-found.exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalFilters(new NotFoundExceptionFilter());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('wallet-service')
      .setVersion('0.1.0')
      .build(),
  );

  SwaggerModule.setup('/swagger-ui', app, document);

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
