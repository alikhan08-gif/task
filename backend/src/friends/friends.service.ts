import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendRequest(senderId: string, email: string) {
    const receiver = await this.prisma.user.findUnique({ where: { email } });
    if (!receiver) {
      throw new NotFoundException('Bu email bilan foydalanuvchi topilmadi');
    }
    if (receiver.id === senderId) {
      throw new BadRequestException("O'zingizga so'rov yubora olmaysiz");
    }

    const existing = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId },
        ],
        status: { in: [FriendRequestStatus.PENDING, FriendRequestStatus.ACCEPTED] },
      },
    });
    if (existing) {
      throw new ConflictException(
        existing.status === FriendRequestStatus.ACCEPTED
          ? "Siz allaqachon do'stsiz"
          : "So'rov allaqachon yuborilgan",
      );
    }

    return this.prisma.friendRequest.create({
      data: { senderId, receiverId: receiver.id },
      include: { receiver: { select: { id: true, email: true } } },
    });
  }

  async listIncoming(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: FriendRequestStatus.PENDING },
      include: { sender: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      sender: r.sender,
    }));
  }

  private async findOwnedIncoming(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException("So'rov topilmadi");
    }
    if (request.receiverId !== userId) {
      throw new ForbiddenException("Bu so'rovga ruxsatingiz yo'q");
    }
    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException("So'rov allaqachon ko'rib chiqilgan");
    }
    return request;
  }

  async accept(userId: string, requestId: string) {
    const request = await this.findOwnedIncoming(userId, requestId);
    return this.prisma.friendRequest.update({
      where: { id: request.id },
      data: { status: FriendRequestStatus.ACCEPTED, respondedAt: new Date() },
      include: { sender: { select: { id: true, email: true } } },
    });
  }

  async decline(userId: string, requestId: string): Promise<{ id: string }> {
    const request = await this.findOwnedIncoming(userId, requestId);
    await this.prisma.friendRequest.delete({ where: { id: request.id } });
    return { id: request.id };
  }

  async listFriends(userId: string) {
    const accepted = await this.prisma.friendRequest.findMany({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });
    const friendIds = accepted.map((r) =>
      r.senderId === userId ? r.receiverId : r.senderId,
    );
    if (friendIds.length === 0) {
      return [];
    }

    const [users, xpSums] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: friendIds } },
        include: { streak: true },
      }),
      this.prisma.xPTransaction.groupBy({
        by: ['userId'],
        where: { userId: { in: friendIds } },
        _sum: { amount: true },
      }),
    ]);
    const xpByUserId = new Map(xpSums.map((s) => [s.userId, s._sum.amount ?? 0]));

    return users
      .map((u) => ({
        id: u.id,
        email: u.email,
        xp: xpByUserId.get(u.id) ?? 0,
        streak: {
          current: u.streak?.currentStreak ?? 0,
          longest: u.streak?.longestStreak ?? 0,
        },
      }))
      .sort((a, b) => b.xp - a.xp);
  }
}
