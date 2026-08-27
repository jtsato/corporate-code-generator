import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { EnvironmentSymbol } from './config/environment';
import type { Environment } from './config/environment';
import { ResponseTransformerInterceptor } from '@wallet-service/web-api/commons/interceptors/response-transformer.interceptor';

async function bootstrap(): Promise<void> {
  // Environment validation runs inside this call, through ConfigModule, so an
  // invalid deployment fails here rather than at the first request needing a value.
  const app = await NestFactory.create(AppModule);
  const environment = app.get<Environment>(EnvironmentSymbol);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseTransformerInterceptor(app.get(HttpAdapterHost)));

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('wallet-service')
      .setVersion('0.1.0')
      .build(),
  );

  SwaggerModule.setup('/swagger-ui', app, document);

  // Absent origins mean CORS is never enabled, rather than enabled with an empty
  // allowlist: the two differ in the headers the browser sees on a failed request.
  const { cors } = environment;
  if (cors.enabled) {
    app.enableCors({
      // A wildcard must be the bare string. Passed inside an array it is compared
      // literally against the request's Origin, matches nothing, and the response
      // carries every CORS header except Access-Control-Allow-Origin — which the
      // browser then rejects, with the server looking correctly configured.
      origin: cors.allowedOrigins.includes('*') ? '*' : [...cors.allowedOrigins],
      methods: [...cors.allowedMethods],
      allowedHeaders: [...cors.allowedHeaders],
      exposedHeaders: [...cors.exposedHeaders],
      credentials: cors.allowCredentials,
      maxAge: cors.maxAge,
    });
  }

  await app.listen(environment.port);
}

void bootstrap();
