import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import request = require('supertest');

import { AppModule } from '../src/app.module';
import { ResponseTransformerInterceptor } from '@wallet-service/web-api/commons/interceptors/response-transformer.interceptor';

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

  it('retains a deleted record and restores it', async () => {
    const identifier = "00000000-0000-4000-8000-000000000002";
    const representation = {
      id: identifier,
      balance: 1.5,
    };

    await request(app.getHttpServer())
      .post('/wallets')
      .send(representation)
      .expect(201);

    await request(app.getHttpServer())
      .delete('/wallets/' + identifier)
      .expect(204);

    // Deleting hides the row from the active routes; it does not remove it.
    await request(app.getHttpServer())
      .get('/wallets/' + identifier)
      .expect(404);

    const tombstone = await request(app.getHttpServer())
      .get('/wallets/deleted/' + identifier)
      .expect(200);
    expect(tombstone.body).toMatchObject(representation);
    expect(typeof tombstone.body.deletedAt).toBe('string');

    // `/deleted` is declared before `/:id`, so it is a route rather than an
    // identifier. Were the order reversed this would be a 400 for a malformed
    // identifier instead of a page. Earlier cases leave tombstones of their own,
    // so this asserts membership rather than a total.
    const deletedPage = await request(app.getHttpServer())
      .get('/wallets/deleted?page=0&size=20')
      .expect(200);
    expect(deletedPage.body.items.some(
      (item: { id: string }) => item.id === identifier,
    )).toBe(true);

    const restored = await request(app.getHttpServer())
      .post('/wallets/' + identifier + '/restore')
      .expect(204);
    expect(restored.text).toBe('');

    await request(app.getHttpServer())
      .get('/wallets/' + identifier)
      .expect(200)
      .expect(representation);

    // Restoring an active record is a refusal, not an absence.
    await request(app.getHttpServer())
      .post('/wallets/' + identifier + '/restore')
      .expect(409);

    await request(app.getHttpServer())
      .get('/wallets/deleted/' + identifier)
      .expect(404);

    await request(app.getHttpServer())
      .delete('/wallets/' + identifier)
      .expect(204);
  });

  it('negotiates the response language from Accept-Language', async () => {
    const invalidIdentifier = '/wallets/not-a-uuid';

    // Supported: the weighted header prefers Portuguese over an unsupported tag.
    await request(app.getHttpServer())
      .get(invalidIdentifier)
      .set('Accept-Language', 'fr-FR;q=0.9, pt-BR;q=1.0')
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('Falha de validação');
      });

    // Unsupported: served in the fallback language rather than rejected.
    await request(app.getHttpServer())
      .get(invalidIdentifier)
      .set('Accept-Language', 'fr-FR')
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('Validation failed');
      });

    // Missing: the same deterministic fallback.
    await request(app.getHttpServer())
      .get(invalidIdentifier)
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('Validation failed');
      });
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
