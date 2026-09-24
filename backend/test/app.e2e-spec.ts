import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/filters/http-exception.filter';

describe('TimeUp API (e2e)', () => {
  let app: INestApplication;
  const email = `e2e-${Date.now()}@timeup.uz`;
  const otherEmail = `e2e-other-${Date.now()}@timeup.uz`;
  let accessToken: string;
  let refreshToken: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("ro'yxatdan o'tadi va tokenlar qaytaradi", async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123', timezone: 'Asia/Tashkent' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("bir xil email bilan qayta ro'yxatdan o'tkazmaydi (409)", async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123', timezone: 'Asia/Tashkent' })
      .expect(409);
  });

  it("yaroqsiz timezone bilan ro'yxatdan o'tkazmaydi (400)", async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `bad-${Date.now()}@timeup.uz`,
        password: 'password123',
        timezone: 'Mars/Colony',
      })
      .expect(400);
  });

  it('tokensiz himoyalangan endpointga kirmaydi (401)', async () => {
    await request(app.getHttpServer()).get('/api/v1/tasks').expect(401);
  });

  it('refresh token orqali yangi access token oladi', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('vazifa yaratadi', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'E2E vazifa' })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    taskId = res.body.id;
  });

  it('vazifani bajarilgan deb belgilaydi', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.status).toBe('COMPLETED');
  });

  it('qayta bajarish idempotent — xato bermaydi, holatni saqlaydi', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.status).toBe('COMPLETED');
  });

  it("bajarilgandan keyin profilda streak va XP ko'rinadi", async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.streak.current).toBeGreaterThanOrEqual(1);
  });

  it('boshqa foydalanuvchi begona vazifani bajara olmaydi (403)', async () => {
    const otherReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: otherEmail,
        password: 'password123',
        timezone: 'Europe/London',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${otherReg.body.accessToken}`)
      .expect(403);
  });

  it("mavjud bo'lmagan vazifa uchun 404 qaytaradi", async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tasks/00000000-0000-0000-0000-000000000000/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it("vazifani o'chiradi (soft delete) va ro'yxatda ko'rinmaydi", async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      res.body.find((t: { id: string }) => t.id === taskId),
    ).toBeUndefined();
  });
});
