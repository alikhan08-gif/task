import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import type { Task } from '@prisma/client';

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;

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
      } catch {
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
  }
}
