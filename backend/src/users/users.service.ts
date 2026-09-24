import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { streak: true },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return {
      id: user.id,
      email: user.email,
      timezone: user.timezone,
      createdAt: user.createdAt,
      streak: user.streak
        ? {
            current: user.streak.currentStreak,
            longest: user.streak.longestStreak,
          }
        : { current: 0, longest: 0 },
    };
  }

  async updateTimezone(userId: string, timezone: string) {
    if (!this.isValidTimezone(timezone)) {
      throw new BadRequestException(`Noto'g'ri timezone: ${timezone}`);
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { timezone },
    });
    return this.getProfile(userId);
  }
}
