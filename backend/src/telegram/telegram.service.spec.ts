import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      telegramLinkToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      telegramLink: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };

    const config = new ConfigService({
      TELEGRAM_BOT_TOKEN: 'test-token',
      TELEGRAM_BOT_USERNAME: 'TimeUpTestBot',
      TELEGRAM_WEBHOOK_SECRET: 'test-secret',
    });

    service = new TelegramService(
      prisma as unknown as PrismaService,
      config,
      {} as unknown as TasksService,
    );
  });

  describe('createLinkToken', () => {
    it("bot yoqilgan bo'lsa token yaratadi va deepLink qaytaradi", async () => {
      prisma.telegramLinkToken.create.mockResolvedValue({});

      const result = await service.createLinkToken('user-1');

      expect(result.deepLink).toBe(
        `https://t.me/TimeUpTestBot?start=${result.token}`,
      );
      expect(prisma.telegramLinkToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: result.token,
            userId: 'user-1',
          }),
        }),
      );
    });

    it("TELEGRAM_BOT_USERNAME sozlanmagan bo'lsa xato tashlaydi", async () => {
      const configWithoutUsername = new ConfigService({
        TELEGRAM_BOT_TOKEN: 'test-token',
      });
      const svc = new TelegramService(
        prisma as unknown as PrismaService,
        configWithoutUsername,
        {} as unknown as TasksService,
      );

      await expect(svc.createLinkToken('user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('consumeLinkToken', () => {
    it("mavjud bo'lmagan token uchun xato tashlaydi", async () => {
      prisma.telegramLinkToken.findUnique.mockResolvedValue(null);
      await expect(
        service.consumeLinkToken('bad-token', 'chat-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("muddati o'tgan token uchun xato tashlaydi", async () => {
      prisma.telegramLinkToken.findUnique.mockResolvedValue({
        token: 't1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(
        service.consumeLinkToken('t1', 'chat-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ishlatilgan token uchun xato tashlaydi', async () => {
      prisma.telegramLinkToken.findUnique.mockResolvedValue({
        token: 't1',
        userId: 'user-1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
      });
      await expect(
        service.consumeLinkToken('t1', 'chat-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('yaroqli token bilan TelegramLink yaratadi', async () => {
      prisma.telegramLinkToken.findUnique.mockResolvedValue({
        token: 't1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 100000),
      });
      prisma.telegramLinkToken.update.mockResolvedValue({});
      prisma.telegramLink.upsert.mockResolvedValue({});

      await service.consumeLinkToken('t1', 'chat-42');

      expect(prisma.telegramLink.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { userId: 'user-1', telegramChatId: 'chat-42' },
        }),
      );
    });
  });

  describe('callback HMAC imzosi', () => {
    it('bir xil chatId+taskId uchun izchil imzo yaratadi va tasdiqlaydi', () => {
      const sig = (service as any).signTaskCallback('chat-1', 'task-1');
      expect((service as any).verifyTaskCallback('chat-1', 'task-1', sig)).toBe(
        true,
      );
    });

    it('boshqa chatId yoki taskId uchun imzo mos kelmaydi', () => {
      const sig = (service as any).signTaskCallback('chat-1', 'task-1');
      expect((service as any).verifyTaskCallback('chat-2', 'task-1', sig)).toBe(
        false,
      );
      expect((service as any).verifyTaskCallback('chat-1', 'task-2', sig)).toBe(
        false,
      );
    });

    it('qalbakilashtirilgan imzoni rad etadi', () => {
      expect(
        (service as any).verifyTaskCallback('chat-1', 'task-1', 'deadbeef00'),
      ).toBe(false);
    });
  });

  describe('isLinked', () => {
    it("TelegramLink mavjud bo'lsa true qaytaradi", async () => {
      prisma.telegramLink.findUnique.mockResolvedValue({ userId: 'user-1' });
      expect(await service.isLinked('user-1')).toBe(true);
    });

    it("TelegramLink bo'lmasa false qaytaradi", async () => {
      prisma.telegramLink.findUnique.mockResolvedValue(null);
      expect(await service.isLinked('user-1')).toBe(false);
    });
  });
});
