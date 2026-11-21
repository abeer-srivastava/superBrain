/**
 * End-to-end tests against real infrastructure (Mongo, Redis, Qdrant).
 * Start them with `docker compose up -d mongodb redis qdrant`, then run
 * `npm run test:e2e`.
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/main';

describe('SuperBrain API (e2e)', () => {
  let app: INestApplication;
  const suffix = Date.now().toString(36);
  let a: ReturnType<typeof request.agent>;
  let b: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    a = request.agent(app.getHttpServer());
    b = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await a.delete('/api/v1/account').send({ password: 'alice-password' });
    await b.delete('/api/v1/account').send({ password: 'bob-password' });
    await app.close();
  });

  it('reports liveness', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('signs up with an httpOnly session cookie', async () => {
    const res = await a
      .post('/api/v1/auth/signup')
      .send({ username: `alice_${suffix}`, email: `alice_${suffix}@example.com`, password: 'alice-password' })
      .expect(201);
    expect(res.body.user.username).toBe(`alice_${suffix}`);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(String(res.headers['set-cookie'])).toMatch(/sb_session=.*HttpOnly/i);
    await b
      .post('/api/v1/auth/signup')
      .send({ username: `bob_${suffix}`, email: `bob_${suffix}@example.com`, password: 'bob-password' })
      .expect(201);
  });

  it('rejects duplicate usernames with 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ username: `alice_${suffix}`, email: `other_${suffix}@example.com`, password: 'whatever123' })
      .expect(409);
  });

  it('requires authentication for content', async () => {
    await request(app.getHttpServer()).get('/api/v1/content').expect(401);
  });

  it('isolates users from each other', async () => {
    const note = await a.post('/api/v1/content').send({ type: 'note', extractedText: 'Alice private thought' }).expect(201);
    const id = note.body._id;
    await b.get(`/api/v1/content/${id}`).expect(404);
    await b.delete(`/api/v1/content/${id}`).expect(404);
    await b.patch(`/api/v1/content/${id}`).send({ title: 'pwned' }).expect(404);
    const list = await b.get('/api/v1/content').expect(200);
    expect(list.body.items).toHaveLength(0);
    await a.get(`/api/v1/content/${id}`).expect(200);
  });

  it('blocks SSRF targets up front', async () => {
    const res = await a.post('/api/v1/content').send({ type: 'link', originalLink: 'http://169.254.169.254/latest' }).expect(400);
    expect(res.body.message).toMatch(/private network/);
  });

  it('never exposes notes on the public page', async () => {
    const share = await a.post('/api/v1/share').send({ enabled: true }).expect(200);
    const pub = await request(app.getHttpServer()).get(`/api/v1/public/${share.body.hash}`).expect(200);
    expect(JSON.stringify(pub.body)).not.toContain('Alice private thought');
    await a.post('/api/v1/share').send({ enabled: false }).expect(200);
    await request(app.getHttpServer()).get(`/api/v1/public/${share.body.hash}`).expect(404);
  });
});
