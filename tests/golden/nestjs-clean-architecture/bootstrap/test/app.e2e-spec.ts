import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import request = require('supertest');

import { AppModule } from '../src/app.module';
import { ResponseTransformerInterceptor } from '../src/web-api/commons/interceptors/response-transformer.interceptor';

describe('generated NestJS HTTP API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalInterceptors(new ResponseTransformerInterceptor(app.get(HttpAdapterHost)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves health and paged response-envelope endpoints', async () => {
    await request(app.getHttpServer())
      .get('/health-check/live')
      .expect(200)
      .expect({ status: 'UP' });

    await request(app.getHttpServer())
      .get('/wallets?page=0&size=20')
      .expect(200)
      .expect({
        items: [],
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 0,
      });
  });

  it('serves the generated CRUD lifecycle', async () => {
    const identifier = "00000000-0000-4000-8000-000000000001";
    const initial = {
      balance: 1.5,
    };
    const replacement = {
      balance: 2.5,
    };
    const patch = {
      balance: 1.5,
    };
    const createdRepresentation = { id: identifier, ...initial };
    const replacedRepresentation = { id: identifier, ...replacement };
    const patchedRepresentation = {
      ...replacedRepresentation,
      ...patch,
      id: identifier,
    };

    await request(app.getHttpServer())
      .post('/wallets')
      .send({ id: identifier, ...initial })
      .expect(201)
      .expect(createdRepresentation);

    await request(app.getHttpServer())
      .get('/wallets/' + identifier)
      .expect(200)
      .expect(createdRepresentation);

    await request(app.getHttpServer())
      .get('/wallets?page=0&size=20')
      .expect(200)
      .expect({
        items: [createdRepresentation],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      });
    await request(app.getHttpServer())
      .put('/wallets/' + identifier)
      .send(replacement)
      .expect(200)
      .expect(replacedRepresentation);

    await request(app.getHttpServer())
      .patch('/wallets/' + identifier)
      .send(patch)
      .expect(200)
      .expect(patchedRepresentation);

    await request(app.getHttpServer())
      .patch('/wallets/' + identifier)
      .send({})
      .expect(400);

    const deleted = await request(app.getHttpServer())
      .delete('/wallets/' + identifier)
      .expect(204);
    expect(deleted.text).toBe('');

    await request(app.getHttpServer())
      .get('/wallets/' + identifier)
      .expect(404);

    await request(app.getHttpServer())
      .delete('/wallets/' + identifier)
      .expect(404);
  });

  it('localizes validation and uniqueness errors from Accept-Language', async () => {
    await request(app.getHttpServer())
      .post('/wallets')
      .send({ id: 'not-a-uuid' })
      .expect(400);

    await request(app.getHttpServer())
      .get('/wallets/not-a-uuid')
      .set('Accept-Language', 'pt-BR')
      .expect(400)
      .expect({
        statusCode: 400,
        message: 'Falha de validação',
        violations: [{ field: 'id', message: 'id has an invalid value' }],
      });
  });
});
