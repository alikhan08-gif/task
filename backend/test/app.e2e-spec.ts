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
  let otherAccessToken: string;

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

    otherAccessToken = otherReg.body.accessToken;

    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
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

  it('tokensiz /telegram/link chaqirilsa 401 qaytaradi', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/telegram/link')
      .expect(401);
  });

  it('bot sozlanmagan muhitda /telegram/link 400 qaytaradi', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/telegram/link')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('profilda telegramLinked maydoni bor va false', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.telegramLinked).toBe(false);
  });

  describe("do'stlar", () => {
    let requestId: string;

    it("mavjud bo'lmagan email uchun 404 qaytaradi", async () => {
      await request(app.getHttpServer())
        .post('/api/v1/friends/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: `yoq-${Date.now()}@timeup.uz` })
        .expect(404);
    });

    it("do'stlik so'rovi yuboradi", async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/friends/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: otherEmail })
        .expect(201);

      expect(res.body.status).toBe('PENDING');
      requestId = res.body.id;
    });

    it("bir xil foydalanuvchiga qayta so'rov yuborsa 409 qaytaradi", async () => {
      await request(app.getHttpServer())
        .post('/api/v1/friends/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: otherEmail })
        .expect(409);
    });

    it("qabul qiluvchi kiruvchi so'rovlar ro'yxatida ko'radi", async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/friends/requests/incoming')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(200);

      expect(res.body.some((r: { id: string }) => r.id === requestId)).toBe(true);
    });

    it("boshqa foydalanuvchi begona so'rovni qabul qila olmaydi (403)", async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/friends/requests/${requestId}/accept`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it("qabul qiluvchi so'rovni tasdiqlaydi", async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/friends/requests/${requestId}/accept`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(201);
    });

    it("ikkalasining do'stlar ro'yxatida bir-birini ko'rsatadi", async () => {
      const mine = await request(app.getHttpServer())
        .get('/api/v1/friends')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(mine.body.some((f: { email: string }) => f.email === otherEmail)).toBe(true);

      const theirs = await request(app.getHttpServer())
        .get('/api/v1/friends')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(200);
      expect(theirs.body.some((f: { email: string }) => f.email === email)).toBe(true);
    });
  });
});
