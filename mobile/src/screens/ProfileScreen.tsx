import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Linking } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { BellIcon, ChevronRightIcon, GlobeIcon, LogoutIcon, SendIcon } from '../components/icons';
import { useAuth } from '../api/AuthContext';
import { api, ApiError } from '../api/client';
import { notify } from '../utils/notify';

export function ProfileScreen() {
  const { profile, accessToken, logout, refreshProfile } = useAuth();
  const email = profile?.email ?? '—';
  const initials = email.slice(0, 2).toUpperCase();
  const [isLinking, setIsLinking] = useState(false);

  const onTelegramPress = async () => {
    if (!accessToken || profile?.telegramLinked) return;
    setIsLinking(true);
    try {
      const { deepLink } = await api.telegramLink(accessToken);
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

          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <GlobeIcon size={17} />
            </View>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={styles.settingsTitle}>Vaqt zonasi</Text>
              <Text style={styles.settingsSubtitle}>{profile?.timezone ?? 'Asia/Tashkent'}</Text>
            </View>
            <ChevronRightIcon />
          </View>

          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <BellIcon size={17} color={colors.accent} strokeWidth={1.7} />
            </View>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={styles.settingsTitle}>Bildirishnomalar</Text>
              <Text style={styles.settingsSubtitle}>O'rtacha chastota</Text>
            </View>
            <ChevronRightIcon />
          </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
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
