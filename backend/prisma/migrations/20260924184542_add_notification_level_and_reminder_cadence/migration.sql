-- CreateEnum
CREATE TYPE "NotificationLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "reminderCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notificationLevel" "NotificationLevel" NOT NULL DEFAULT 'MEDIUM';
