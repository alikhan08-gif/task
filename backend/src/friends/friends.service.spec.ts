import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FriendsService', () => {
  let service: FriendsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      friendRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      xPTransaction: {
        groupBy: jest.fn(),
      },
    };
    service = new FriendsService(prisma as unknown as PrismaService);
  });

  describe('sendRequest', () => {
    it("mavjud bo'lmagan email uchun NotFoundException tashlaydi", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.sendRequest('user-1', 'nobody@timeup.uz'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("o'ziga so'rov yuborishga urinsa BadRequestException tashlaydi", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'me@timeup.uz' });
      await expect(
        service.sendRequest('user-1', 'me@timeup.uz'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("allaqachon do'st bo'lsa ConflictException tashlaydi", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'friend@timeup.uz' });
      prisma.friendRequest.findFirst.mockResolvedValue({ status: 'ACCEPTED' });
      await expect(
        service.sendRequest('user-1', 'friend@timeup.uz'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("so'rov allaqachon kutilayotgan bo'lsa ConflictException tashlaydi", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'friend@timeup.uz' });
      prisma.friendRequest.findFirst.mockResolvedValue({ status: 'PENDING' });
      await expect(
        service.sendRequest('user-1', 'friend@timeup.uz'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("yaroqli so'rovni yaratadi", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'friend@timeup.uz' });
      prisma.friendRequest.findFirst.mockResolvedValue(null);
      prisma.friendRequest.create.mockResolvedValue({ id: 'req-1' });

      await service.sendRequest('user-1', 'friend@timeup.uz');

      expect(prisma.friendRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { senderId: 'user-1', receiverId: 'user-2' },
        }),
      );
    });
  });

  describe('accept/decline orqali egalik tekshiruvi', () => {
    it("boshqa foydalanuvchining so'rovini qabul qilishga urinsa ForbiddenException tashlaydi", async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        receiverId: 'someone-else',
        status: 'PENDING',
      });
      await expect(service.accept('user-1', 'req-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("allaqachon ko'rib chiqilgan so'rovni qabul qilishga urinsa BadRequestException tashlaydi", async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        receiverId: 'user-1',
        status: 'ACCEPTED',
      });
      await expect(service.accept('user-1', 'req-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('yaroqli so\'rovni qabul qiladi', async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        receiverId: 'user-1',
        status: 'PENDING',
      });
      prisma.friendRequest.update.mockResolvedValue({ id: 'req-1', status: 'ACCEPTED' });

      await service.accept('user-1', 'req-1');

      expect(prisma.friendRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1' },
          data: expect.objectContaining({ status: 'ACCEPTED' }),
        }),
      );
    });

    it("so'rovni rad etadi (yozuvni o'chiradi)", async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        receiverId: 'user-1',
        status: 'PENDING',
      });
      prisma.friendRequest.delete.mockResolvedValue({});

      await service.decline('user-1', 'req-1');

      expect(prisma.friendRequest.delete).toHaveBeenCalledWith({ where: { id: 'req-1' } });
    });
  });

  describe('listFriends', () => {
    it("do'stlar bo'lmasa bo'sh ro'yxat qaytaradi va so'rov yubormaydi", async () => {
      prisma.friendRequest.findMany.mockResolvedValue([]);
      const result = await service.listFriends('user-1');
      expect(result).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it("do'stlarni XP bo'yicha kamayish tartibida qaytaradi", async () => {
      prisma.friendRequest.findMany.mockResolvedValue([
        { senderId: 'user-1', receiverId: 'user-2' },
        { senderId: 'user-3', receiverId: 'user-1' },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-2', email: 'b@timeup.uz', streak: { currentStreak: 1, longestStreak: 2 } },
        { id: 'user-3', email: 'c@timeup.uz', streak: null },
      ]);
      prisma.xPTransaction.groupBy.mockResolvedValue([
        { userId: 'user-2', _sum: { amount: 10 } },
        { userId: 'user-3', _sum: { amount: 50 } },
      ]);

      const result = await service.listFriends('user-1');

      expect(result.map((f) => f.id)).toEqual(['user-3', 'user-2']);
      expect(result[0].xp).toBe(50);
      expect(result[1].streak).toEqual({ current: 1, longest: 2 });
      expect(result[0].streak).toEqual({ current: 0, longest: 0 });
    });
  });
});
