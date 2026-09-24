import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: Record<string, jest.Mock> };
  let jwtService: JwtService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = new JwtService({});
    jest.spyOn(jwtService, 'signAsync').mockResolvedValue('signed-token');

    const config = new ConfigService({
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
    });

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService,
      config,
    );
  });

  describe('register', () => {
    it('allaqachon mavjud email uchun ConflictException tashlaydi', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@a.com' });

      await expect(
        service.register({
          email: 'a@a.com',
          password: 'password123',
          timezone: 'Asia/Tashkent',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('yaroqsiz timezone uchun BadRequestException tashlaydi', async () => {
      await expect(
        service.register({
          email: 'b@b.com',
          password: 'password123',
          timezone: 'Not/AZone',
        }),
      ).rejects.toThrow(/timezone/i);
    });

    it('yangi foydalanuvchi yaratadi va tokenlar qaytaradi', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: '1',
        email: 'c@c.com',
        timezone: 'Asia/Tashkent',
        createdAt: new Date(),
      });

      const result = await service.register({
        email: 'c@c.com',
        password: 'password123',
        timezone: 'Asia/Tashkent',
      });

      expect(result.user.email).toBe('c@c.com');
      expect(result.accessToken).toBe('signed-token');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ streak: { create: {} } }),
        }),
      );
    });
  });

  describe('login', () => {
    it("mavjud bo'lmagan email uchun UnauthorizedException tashlaydi", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@x.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("noto'g'ri parol uchun UnauthorizedException tashlaydi", async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'x@x.com',
        passwordHash: hash,
        timezone: 'Asia/Tashkent',
        createdAt: new Date(),
      });

      await expect(
        service.login({ email: 'x@x.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
