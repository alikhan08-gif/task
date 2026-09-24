import { IsEnum } from 'class-validator';
import { NotificationLevel } from '@prisma/client';

export class UpdateNotificationLevelDto {
  @IsEnum(NotificationLevel)
  notificationLevel: NotificationLevel;
}
