import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import { BellIcon, FlameIcon, PlusIcon, StarIcon } from '../components/icons';
import { TaskRow } from '../components/TaskRow';
import { todayTasks } from '../data/mock';
import { useAuth } from '../api/AuthContext';
import type { AppNavigationProp } from '../navigation/types';

export function HomeScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { profile } = useAuth();
  const firstName = profile?.email.split('@')[0] ?? 'foydalanuvchi';
  const streak = profile?.streak.current ?? 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>Payshanba, 24-sentyabr</Text>
          <Text style={styles.heading}>Xayrli tong, {firstName}</Text>
        </View>
        <View style={styles.iconBtn}>
          <BellIcon size={19} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statLabelRow}>
            <FlameIcon size={16} />
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <Text style={styles.statValue}>{streak} kun</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statLabelRow}>
            <StarIcon size={16} />
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <Text style={styles.statValue}>240</Text>
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>Bugungi vazifalar</Text>
          <Pressable onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.linkText}>Barchasi</Text>
          </Pressable>
        </View>

        <FlatList
          data={todayTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => <TaskRow task={item} variant="inline" />}
          ListEmptyComponent={<Text style={styles.emptyText}>Bugun uchun vazifa yo'q</Text>}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        onPress={() => navigation.navigate('CreateTask')}
        accessibilityLabel="Yangi vazifa qo'shish"
      >
        <PlusIcon size={24} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 14,
    gap: spacing.sm,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: spacing.xxl,
    bottom: spacing.xxl + 4,
    width: 54,
    height: 54,
    borderRadius: radii.round,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
