import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;

  const owner = { id: 'user-1', timezone: 'Asia/Tashkent' };

  beforeEach(() => {
    prisma = {
      task: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(owner),
      },
      streak: {
        upsert: jest.fn(),
        update: jest.fn(),
      },
      xPTransaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new TasksService(prisma as unknown as PrismaService);
  });

  describe('findOwned orqali ruxsat tekshiruvi', () => {
    it('topilmagan vazifa uchun NotFoundException tashlaydi', async () => {
      prisma.task.findUnique.mockResolvedValue(null);
      await expect(
        service.update('user-1', 'task-1', { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('boshqa foydalanuvchi vazifasiga kirishga urinsa ForbiddenException tashlaydi', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        userId: 'someone-else',
        deletedAt: null,
      });
      await expect(
        service.update('user-1', 'task-1', { title: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('complete', () => {
    it('allaqachon bajarilgan vazifani qayta bajarish idempotent (xato bermaydi, qayta XP bermaydi)', async () => {
      const completedTask = {
        id: 'task-1',
        userId: 'user-1',
        status: TaskStatus.COMPLETED,
        deletedAt: null,
      };
      prisma.task.findUnique.mockResolvedValue(completedTask);

      const result = await service.complete('user-1', 'task-1');

      expect(result).toBe(completedTask);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.xPTransaction.create).not.toHaveBeenCalled();
    });

    it("birinchi marta bajarilganda streak = 1 bo'ladi", async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        userId: 'user-1',
        status: TaskStatus.PENDING,
        deletedAt: null,
      });
      prisma.$transaction.mockResolvedValue([
        { id: 'task-1', status: TaskStatus.COMPLETED },
      ]);
      prisma.streak.upsert.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
      });
      prisma.streak.update.mockImplementation(({ data }: any) => ({
        userId: 'user-1',
        ...data,
      }));

      await service.complete('user-1', 'task-1');

      expect(prisma.streak.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 1, longestStreak: 1 }),
        }),
      );
    });

    it('ketma-ket kunlarda bajarilsa streak oshadi', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        userId: 'user-1',
        status: TaskStatus.PENDING,
        deletedAt: null,
      });
      prisma.$transaction.mockResolvedValue([
        { id: 'task-1', status: TaskStatus.COMPLETED },
      ]);

      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      prisma.streak.upsert.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 3,
        longestStreak: 5,
        lastCompletedDate: yesterdayStr,
      });
      prisma.streak.update.mockImplementation(({ data }: any) => ({
        userId: 'user-1',
        ...data,
      }));

      await service.complete('user-1', 'task-1');

      expect(prisma.streak.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 4, longestStreak: 5 }),
        }),
      );
    });

    it("kun o'tkazib yuborilsa (gap) streak 1 ga qaytadi", async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        userId: 'user-1',
        status: TaskStatus.PENDING,
        deletedAt: null,
      });
      prisma.$transaction.mockResolvedValue([
        { id: 'task-1', status: TaskStatus.COMPLETED },
      ]);

      prisma.streak.upsert.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 7,
        longestStreak: 10,
        lastCompletedDate: '2020-01-01',
      });
      prisma.streak.update.mockImplementation(({ data }: any) => ({
        userId: 'user-1',
        ...data,
      }));

      await service.complete('user-1', 'task-1');

      expect(prisma.streak.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStreak: 1,
            longestStreak: 10,
          }),
        }),
      );
    });
  });
});
