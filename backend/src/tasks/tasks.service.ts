import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  calendarDateInTimezone,
  daysBetweenCalendarDates,
} from '../common/timezone.util';

const XP_PER_COMPLETION = 10;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.task.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      },
    });
  }

  private async findOwned(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.deletedAt) {
      throw new NotFoundException('Vazifa topilmadi');
    }
    if (task.userId !== userId) {
      throw new ForbiddenException("Bu vazifaga ruxsatingiz yo'q");
    }
    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    await this.findOwned(userId, taskId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        version: { increment: 1 },
      },
    });
  }

  async remove(userId: string, taskId: string) {
    await this.findOwned(userId, taskId);
    await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
    return { id: taskId, deleted: true };
  }

  /** Vazifani bajarilgan deb belgilaydi. Idempotent: qayta chaqirilsa xato bermaydi. */
  async complete(userId: string, taskId: string) {
    const task = await this.findOwned(userId, taskId);

    if (task.status === TaskStatus.COMPLETED) {
      return task;
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const now = new Date();

    const [updatedTask] = await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: now,
          version: { increment: 1 },
        },
      }),
      this.prisma.xPTransaction.create({
        data: { userId, amount: XP_PER_COMPLETION, reason: 'TASK_COMPLETED' },
      }),
    ]);

    await this.applyStreak(userId, user.timezone, now);

    return updatedTask;
  }

  private async applyStreak(
    userId: string,
    timezone: string,
    completedAt: Date,
  ) {
    const today = calendarDateInTimezone(completedAt, timezone);
    const streak = await this.prisma.streak.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastCompletedDate: today,
      },
      update: {},
    });

    if (streak.lastCompletedDate === today) {
      return streak;
    }

    const gap = streak.lastCompletedDate
      ? daysBetweenCalendarDates(streak.lastCompletedDate, today)
      : null;

    const nextCurrent = gap === 1 ? streak.currentStreak + 1 : 1;
    const nextLongest = Math.max(streak.longestStreak, nextCurrent);

    return this.prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: nextCurrent,
        longestStreak: nextLongest,
        lastCompletedDate: today,
      },
    });
  }
}
