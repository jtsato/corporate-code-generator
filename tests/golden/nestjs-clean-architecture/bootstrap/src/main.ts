import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NotFoundExceptionFilter } from './web-api/commons/filters/not-found.exception.filter';
import { ResponseTransformerInterceptor } from './web-api/commons/interceptors/response-transformer.interceptor';
import { ValidationExceptionFilter } from './web-api/commons/filters/validation.exception.filter';
import { I18nService } from './web-api/i18n/i18n.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const i18n = new I18nService();
  app.useGlobalFilters(new NotFoundExceptionFilter(i18n), new ValidationExceptionFilter(i18n));
  app.useGlobalInterceptors(new ResponseTransformerInterceptor(app.get(HttpAdapterHost)));

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
