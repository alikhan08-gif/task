import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { TelegramService } from './telegram.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('link')
  createLink(@CurrentUser() user: RequestUser) {
    return this.telegramService.createLinkToken(user.userId);
  }

  @Post('remind/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remind(
    @CurrentUser() user: RequestUser,
    @Param('taskId') taskId: string,
  ) {
    await this.telegramService.sendReminderForTask(user.userId, taskId);
  }
}
