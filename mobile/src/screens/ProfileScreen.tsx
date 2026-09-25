import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import { BellIcon, CheckIcon, ChevronRightIcon, GlobeIcon, LogoutIcon, SendIcon, UsersIcon } from '../components/icons';
import { useAuth } from '../api/AuthContext';
import { api, ApiError, NotificationLevel } from '../api/client';
import { notify } from '../utils/notify';
import type { AppNavigationProp } from '../navigation/types';

const COMMON_TIMEZONES = [
  'Asia/Tashkent',
  'Asia/Almaty',
  'Asia/Bishkek',
  'Asia/Dushanbe',
  'Asia/Ashgabat',
  'Asia/Qostanay',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Asia/Tokyo',
];

const NOTIFICATION_OPTIONS: { level: NotificationLevel; title: string; subtitle: string }[] = [
  {
    level: 'LOW',
    title: 'Past',
    subtitle: "Muddatdan 15 daqiqa keyin, bir marta",
  },
  {
    level: 'MEDIUM',
    title: "O'rtacha",
    subtitle: 'Muddati kelganda, bir marta',
  },
  {
    level: 'HIGH',
    title: 'Yuqori',
    subtitle: "Muddati kelganda va bajarilmaguncha har 15 daqiqada (3 martagacha)",
  },
];

function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function ProfileScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { profile, accessToken, logout, refreshProfile } = useAuth();
  const email = profile?.email ?? '—';
  const initials = email.slice(0, 2).toUpperCase();
  const [isLinking, setIsLinking] = useState(false);
  const [isTimezonePickerOpen, setIsTimezonePickerOpen] = useState(false);
  const [isNotificationPickerOpen, setIsNotificationPickerOpen] = useState(false);
  const [customTimezone, setCustomTimezone] = useState('');
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  const [isSavingNotificationLevel, setIsSavingNotificationLevel] = useState(false);

  const notificationLevelLabel =
    NOTIFICATION_OPTIONS.find((o) => o.level === profile?.notificationLevel)?.title ??
    "O'rtacha";

  const onSelectTimezone = async (timezone: string) => {
    if (!accessToken) return;
    setIsSavingTimezone(true);
    try {
      await api.updateTimezone(timezone);
      await refreshProfile();
      setIsTimezonePickerOpen(false);
      setCustomTimezone('');
    } catch (err) {
      notify(
        "Saqlab bo'lmadi",
        err instanceof ApiError ? err.message : "Vaqt zonasini saqlab bo'lmadi",
      );
    } finally {
      setIsSavingTimezone(false);
    }
  };

  const onSubmitCustomTimezone = () => {
    const trimmed = customTimezone.trim();
    if (!trimmed) return;
    if (!isValidTimezone(trimmed)) {
      notify("Noto'g'ri vaqt zonasi", "Masalan: Asia/Tashkent, Europe/London");
      return;
    }
    onSelectTimezone(trimmed);
  };

  const onSelectNotificationLevel = async (level: NotificationLevel) => {
    if (!accessToken) return;
    setIsSavingNotificationLevel(true);
    try {
      await api.updateNotificationLevel(level);
      await refreshProfile();
      setIsNotificationPickerOpen(false);
    } catch (err) {
      notify(
        "Saqlab bo'lmadi",
        err instanceof ApiError ? err.message : "Bildirishnoma darajasini saqlab bo'lmadi",
      );
    } finally {
      setIsSavingNotificationLevel(false);
    }
  };

  const onTelegramPress = async () => {
    if (!accessToken || profile?.telegramLinked) return;
    setIsLinking(true);
    try {
      const { deepLink } = await api.telegramLink();
      await Linking.openURL(deepLink);
      notify(
        "Telegram ochildi",
        "Botda \"Start\" tugmasini bosing. Bog'langach, shu ekranga qaytib \"yangilash\" uchun boshqa varaqqa o'tib qayting.",
      );
      setTimeout(refreshProfile, 4000);
    } catch (err) {
      notify(
        "Bog'lab bo'lmadi",
        err instanceof ApiError ? err.message : "Telegram bot hozircha sozlanmagan.",
      );
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {email.split('@')[0]}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.xp ?? 0}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.streak.current ?? 0}</Text>
            <Text style={styles.statLabel}>Joriy streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.streak.longest ?? 0}</Text>
            <Text style={styles.statLabel}>Eng uzun</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsHeading}>Sozlamalar</Text>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
            onPress={() => setIsTimezonePickerOpen(true)}
          >
            <View style={styles.settingsIcon}>
              <GlobeIcon size={17} />
            </View>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={styles.settingsTitle}>Vaqt zonasi</Text>
              <Text style={styles.settingsSubtitle}>{profile?.timezone ?? 'Asia/Tashkent'}</Text>
            </View>
            <ChevronRightIcon />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
            onPress={() => setIsNotificationPickerOpen(true)}
          >
            <View style={styles.settingsIcon}>
              <BellIcon size={17} color={colors.accent} strokeWidth={1.7} />
            </View>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={styles.settingsTitle}>Bildirishnomalar</Text>
              <Text style={styles.settingsSubtitle}>{notificationLevelLabel} chastota</Text>
            </View>
            <ChevronRightIcon />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
            onPress={onTelegramPress}
            disabled={isLinking || profile?.telegramLinked}
          >
            <View style={styles.settingsIcon}>
              <SendIcon size={17} />
            </View>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={styles.settingsTitle}>Telegram bot</Text>
              <Text style={styles.settingsSubtitle}>
                {profile?.telegramLinked ? "Bog'langan" : "Bog'lanmagan — bosib ulang"}
              </Text>
            </View>
            {isLinking ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : profile?.telegramLinked ? null : (
              <ChevronRightIcon />
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Friends')}
          >
            <View style={styles.settingsIcon}>
              <UsersIcon size={17} />
            </View>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={styles.settingsTitle}>Do'stlar</Text>
              <Text style={styles.settingsSubtitle}>Do'stlashish va reyting</Text>
            </View>
            <ChevronRightIcon />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
            onPress={logout}
          >
            <View style={[styles.settingsIcon, { backgroundColor: colors.neutralSoft }]}>
              <LogoutIcon size={17} />
            </View>
            <Text style={styles.settingsTitle}>Chiqish</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>TimeUp &middot; v0.1 &middot; Phase 1 MVP</Text>
      </ScrollView>

      <Modal
        visible={isTimezonePickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTimezonePickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsTimezonePickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Vaqt zonasi</Text>
            <View style={styles.customTimezoneRow}>
              <TextInput
                style={styles.customTimezoneInput}
                placeholder="Masalan: Asia/Tashkent"
                placeholderTextColor={colors.textMuted}
                value={customTimezone}
                onChangeText={setCustomTimezone}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={onSubmitCustomTimezone}
              />
              <Pressable
                style={({ pressed }) => [styles.customTimezoneButton, pressed && { opacity: 0.7 }]}
                onPress={onSubmitCustomTimezone}
                disabled={isSavingTimezone || !customTimezone.trim()}
              >
                <Text style={styles.customTimezoneButtonText}>Saqlash</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {COMMON_TIMEZONES.map((tz) => (
                <Pressable
                  key={tz}
                  style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.7 }]}
                  onPress={() => onSelectTimezone(tz)}
                  disabled={isSavingTimezone}
                >
                  <Text style={styles.modalOptionTitle}>{tz}</Text>
                  {profile?.timezone === tz ? <CheckIcon size={18} color={colors.accent} /> : null}
                </Pressable>
              ))}
            </ScrollView>
            {isSavingTimezone ? <ActivityIndicator style={{ marginTop: spacing.sm }} color={colors.accent} /> : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isNotificationPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsNotificationPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsNotificationPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Bildirishnomalar</Text>
            {NOTIFICATION_OPTIONS.map((option) => (
              <Pressable
                key={option.level}
                style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.7 }]}
                onPress={() => onSelectNotificationLevel(option.level)}
                disabled={isSavingNotificationLevel}
              >
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.modalOptionTitle}>{option.title}</Text>
                  <Text style={styles.modalOptionSubtitle}>{option.subtitle}</Text>
                </View>
                {profile?.notificationLevel === option.level ? (
                  <CheckIcon size={18} color={colors.accent} />
                ) : null}
              </Pressable>
            ))}
            {isSavingNotificationLevel ? (
              <ActivityIndicator style={{ marginTop: spacing.sm }} color={colors.accent} />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(32, 31, 28, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalList: {
    marginTop: spacing.sm,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
  },
  modalOptionSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customTimezoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  customTimezoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  customTimezoneButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTimezoneButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: 100,
    gap: spacing.xxl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radii.round,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  settingsSection: {
    gap: spacing.sm + 2,
  },
  settingsHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  settingsSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
