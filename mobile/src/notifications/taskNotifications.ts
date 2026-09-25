import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Task } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Ilova birinchi marta ishga tushganda (yoki kirishdan keyin) bir marta chaqiriladi. */
export async function requestNotificationPermissions(): Promise<void> {
  if (Platform.OS === 'web') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Vazifa eslatmalari',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

function signature(task: Task): string {
  return `${task.title}|${task.dueAt}|${task.remindEnabled}|${task.status}`;
}

// Har bir vazifa uchun oxirgi marta rejalashtirilgan holatni eslab qoladi —
// shu orqali o'zgarmagan vazifalarni har poll'da qayta rejalashtirmaymiz.
const lastSyncedSignature = new Map<string, string>();

/**
 * Joriy vazifalar ro'yxatiga qarab telefon bildirishnomalarini moslashtiradi:
 * muddati kelajakda, bajarilmagan va eslatmasi yoqilgan vazifalar uchun
 * mahalliy bildirishnoma rejalashtiradi; bajarilgan/o'chirilgan/eslatmasi
 * o'chirilgan/muddati o'tgan vazifalarnikini bekor qiladi. Bular server bilan
 * bog'liq emas — Telegram eslatmasidan mustaqil, to'g'ridan-to'g'ri telefonda.
 */
export async function syncTaskNotifications(tasks: Task[]): Promise<void> {
  if (Platform.OS === 'web') return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const now = Date.now();
  const desired = tasks.filter(
    (t) => t.remindEnabled && t.status === 'PENDING' && t.dueAt && new Date(t.dueAt).getTime() > now,
  );
  const desiredIds = new Set(desired.map((t) => t.id));

  for (const id of Array.from(lastSyncedSignature.keys())) {
    if (!desiredIds.has(id)) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      lastSyncedSignature.delete(id);
    }
  }

  for (const task of desired) {
    const sig = signature(task);
    if (lastSyncedSignature.get(task.id) === sig) continue;

    await Notifications.cancelScheduledNotificationAsync(task.id).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: task.id,
      content: {
        title: 'TimeUp',
        body: `${task.title} vazifasini bajarish vaqti keldi`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(task.dueAt as string),
      },
    });
    lastSyncedSignature.set(task.id, sig);
  }
}
