import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { NotificationLevel, TaskStatus } from '@prisma/client';
import type { Task } from '@prisma/client';
import { synthesizeSpeech } from './tts.util';

const LINK_TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Bildirishnoma darajasiga qarab eslatma qachon va necha marta yuborilishini
 * belgilaydi: LOW — muddatdan 15 daqiqa keyin, bir marta; MEDIUM — muddati
 * kelganda, bir marta; HIGH — muddati kelganda va har 15 daqiqada, 3 martagacha.
 */
const REMINDER_CADENCE: Record<
  NotificationLevel,
  { maxReminders: number; initialDelayMs: number; repeatIntervalMs: number }
> = {
  LOW: { maxReminders: 1, initialDelayMs: 15 * 60 * 1000, repeatIntervalMs: 0 },
  MEDIUM: { maxReminders: 1, initialDelayMs: 0, repeatIntervalMs: 0 },
  HIGH: { maxReminders: 3, initialDelayMs: 0, repeatIntervalMs: 15 * 60 * 1000 },
};

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tasksService: TasksService,
  ) {}

  get isEnabled(): boolean {
    return Boolean(this.config.get<string>('TELEGRAM_BOT_TOKEN'));
  }

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        "TELEGRAM_BOT_TOKEN o'rnatilmagan — Telegram bot o'chirilgan holatda ishga tushdi",
      );
      return;
    }

    this.bot = new Telegraf(token);
    this.registerHandlers(this.bot);

    try {
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
    } catch (err) {
      this.logger.error(
        `Telegram botni ishga tushirib bo'lmadi: ${(err as Error).message}`,
      );
      this.bot = null;
      return;
    }

    // bot.launch() polling rejimida hech qachon resolve bo'lmaydi (faqat stop()da) —
    // shuning uchun await qilinmaydi, aks holda butun ilova ishga tushishi to'xtab qoladi.
    this.bot.launch().catch((err: Error) => {
      this.logger.error(`Telegram bot polling to'xtadi: ${err.message}`);
    });
    this.logger.log('Telegram bot polling rejimida ishga tushdi');
  }

  async onModuleDestroy() {
    this.bot?.stop('shutdown');
  }

  private registerHandlers(bot: Telegraf) {
    bot.start(async (ctx) => {
      const payload =
        'startPayload' in ctx
          ? (ctx as { startPayload?: string }).startPayload
          : undefined;
      if (!payload) {
        await ctx.reply(
          'Salom! Men TimeUp botiman. Mobil ilovadagi profil bo\'limidan "Telegram bilan bog\'lash"ni bosing.',
        );
        return;
      }

      try {
        await this.consumeLinkToken(payload, String(ctx.chat.id));
        await ctx.reply(
          "✅ Hisobingiz muvaffaqiyatli bog'landi! Endi eslatmalarni shu yerda olasiz.",
        );
      } catch (err) {
        this.logger.warn(
          `Telegram link muvaffaqiyatsiz (chat ${ctx.chat.id}): ${(err as Error).message}`,
        );
        await ctx.reply(
          "Havola eskirgan yoki noto'g'ri. Ilovada \"Telegram bilan bog'lash\"ni qaytadan bosib ko'ring.",
        );
      }
    });

    bot.action(/^c:([0-9a-fA-F-]{36}):([0-9a-f]{10})$/, async (ctx) => {
      const [, taskId, signature] = ctx.match;
      const chatId = String(ctx.chat?.id ?? '');

      if (!chatId || !this.verifyTaskCallback(chatId, taskId, signature)) {
        await ctx.answerCbQuery("Yaroqsiz so'rov");
        return;
      }

      const link = await this.prisma.telegramLink.findUnique({
        where: { telegramChatId: chatId },
      });
      if (!link) {
        await ctx.answerCbQuery('Hisob topilmadi');
        return;
      }

      try {
        await this.tasksService.complete(link.userId, taskId);
        await ctx.answerCbQuery('Bajarildi! 🎉');
        await ctx.editMessageReplyMarkup(undefined);
      } catch {
        await ctx.answerCbQuery('Xatolik yuz berdi');
      }
    });
  }

  async createLinkToken(
    userId: string,
  ): Promise<{ token: string; deepLink: string }> {
    const botUsername = this.config.get<string>('TELEGRAM_BOT_USERNAME');
    if (!this.isEnabled || !botUsername) {
      throw new BadRequestException('Telegram bot hozircha sozlanmagan');
    }

    const token = crypto.randomBytes(24).toString('hex');
    await this.prisma.telegramLinkToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + LINK_TOKEN_TTL_MS),
      },
    });

    return { token, deepLink: `https://t.me/${botUsername}?start=${token}` };
  }

  async consumeLinkToken(token: string, chatId: string): Promise<void> {
    const record = await this.prisma.telegramLinkToken.findUnique({
      where: { token },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException("Havola yaroqsiz yoki muddati o'tgan");
    }

    await this.prisma.$transaction([
      this.prisma.telegramLinkToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
      // Bu Telegram chat avval boshqa foydalanuvchiga bog'langan bo'lishi mumkin
      // (masalan sinov paytida) — telegramChatId ustunidagi @unique cheklov
      // upsert'ni buzmasligi uchun eski bog'lanishni oldindan tozalaymiz.
      this.prisma.telegramLink.deleteMany({
        where: { telegramChatId: chatId, userId: { not: record.userId } },
      }),
      this.prisma.telegramLink.upsert({
        where: { userId: record.userId },
        create: { userId: record.userId, telegramChatId: chatId },
        update: { telegramChatId: chatId },
      }),
    ]);
  }

  async isLinked(userId: string): Promise<boolean> {
    const link = await this.prisma.telegramLink.findUnique({
      where: { userId },
    });
    return Boolean(link);
  }

  private signTaskCallback(chatId: string, taskId: string): string {
    const secret = this.config.getOrThrow<string>('TELEGRAM_WEBHOOK_SECRET');
    return crypto
      .createHmac('sha256', secret)
      .update(`${chatId}:${taskId}`)
      .digest('hex')
      .slice(0, 10);
  }

  private verifyTaskCallback(
    chatId: string,
    taskId: string,
    signature: string,
  ): boolean {
    const expected = this.signTaskCallback(chatId, taskId);
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    return (
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf)
    );
  }

  /** Test/qo'lda eslatma yuborish uchun: taskId orqali vazifani topib egalikni tekshiradi. */
  async sendReminderForTask(userId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.deletedAt || task.userId !== userId) {
      throw new NotFoundException('Vazifa topilmadi');
    }
    const link = await this.prisma.telegramLink.findUnique({
      where: { userId },
    });
    if (!link) {
      throw new BadRequestException("Telegram hisobingiz bog'lanmagan");
    }
    await this.sendTaskReminder(userId, task);
  }

  /**
   * Har daqiqada muddati kelgan vazifalarni tekshiradi va foydalanuvchining
   * bildirishnoma darajasiga (LOW/MEDIUM/HIGH) mos keladigan jadval bo'yicha
   * Telegram eslatmasini yuboradi.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async sendDueReminders(): Promise<void> {
    if (!this.bot) return;

    const maxReminders = Math.max(
      ...Object.values(REMINDER_CADENCE).map((c) => c.maxReminders),
    );

    const candidates = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.PENDING,
        deletedAt: null,
        remindEnabled: true,
        dueAt: { not: null, lte: new Date() },
        reminderCount: { lt: maxReminders },
      },
      include: { user: { select: { notificationLevel: true } } },
    });

    const now = new Date();

    for (const task of candidates) {
      const cadence = REMINDER_CADENCE[task.user.notificationLevel];

      if (task.reminderCount === 0) {
        const dueSinceMs = now.getTime() - task.dueAt!.getTime();
        if (dueSinceMs < cadence.initialDelayMs) continue;
      } else {
        if (task.reminderCount >= cadence.maxReminders) continue;
        const sinceLastMs =
          now.getTime() - (task.reminderSentAt?.getTime() ?? 0);
        if (sinceLastMs < cadence.repeatIntervalMs) continue;
      }

      try {
        await this.sendTaskReminder(task.userId, task);
      } catch (err) {
        this.logger.error(
          `Eslatma yuborilmadi (vazifa ${task.id}): ${(err as Error).message}`,
        );
      } finally {
        await this.prisma.task.update({
          where: { id: task.id },
          data: { reminderSentAt: now, reminderCount: { increment: 1 } },
        });
      }
    }
  }

  async sendTaskReminder(userId: string, task: Task): Promise<void> {
    if (!this.bot) return;
    const link = await this.prisma.telegramLink.findUnique({
      where: { userId },
    });
    if (!link) return;

    const signature = this.signTaskCallback(link.telegramChatId, task.id);
    await this.bot.telegram.sendMessage(
      link.telegramChatId,
      `⏰ Eslatma: ${task.title}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Bajarildi',
                callback_data: `c:${task.id}:${signature}`,
              },
            ],
          ],
        },
      },
    );

    await this.sendReminderVoice(link.telegramChatId, task.title);
  }

  /**
   * Ovozli eslatmani best-effort tarzda yuboradi — TTS hujjatlashtirilmagan
   * bepul endpointdan foydalanadi va ogohlantirmasdan ishlamay qolishi
   * mumkin, shuning uchun xatolik faqat log'ga yoziladi va asosiy matnli
   * eslatmaga (yuqorida allaqachon yuborilgan) ta'sir qilmaydi.
   */
  private async sendReminderVoice(chatId: string, taskTitle: string): Promise<void> {
    if (!this.bot) return;
    try {
      const audio = await synthesizeSpeech(`${taskTitle} vazifasini bajarish vaqti keldi`);
      await this.bot.telegram.sendAudio(chatId, {
        source: audio,
        filename: 'eslatma.mp3',
      });
    } catch (err) {
      this.logger.warn(
        `Ovozli eslatma yuborilmadi (TTS): ${(err as Error).message}`,
      );
    }
  }
}
