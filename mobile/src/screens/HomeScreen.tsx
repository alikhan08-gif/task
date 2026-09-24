import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import { BellIcon, FlameIcon, PlusIcon, StarIcon } from '../components/icons';
import { TaskRow } from '../components/TaskRow';
import { useAuth } from '../api/AuthContext';
import { useTasks } from '../api/TasksContext';
import { formatHeaderDate, isSameCalendarDay } from '../utils/date';
import { confirmDestructive } from '../utils/confirm';
import type { AppNavigationProp } from '../navigation/types';
import type { Task } from '../api/client';

export function HomeScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { profile } = useAuth();
  const { tasks, isLoading, error, completeTask, deleteTask } = useTasks();
  const firstName = profile?.email.split('@')[0] ?? 'foydalanuvchi';
  const streak = profile?.streak.current ?? 0;
  const xp = profile?.xp ?? 0;

  const today = new Date();
  const todayTasks = useMemo(
    () => tasks.filter((t) => !t.dueAt || isSameCalendarDay(new Date(t.dueAt), today)),
    [tasks],
  );

  const onEditTask = (task: Task) => {
    navigation.navigate('CreateTask', { taskId: task.id });
  };

  const onDeleteTask = (task: Task) => {
    confirmDestructive("Vazifani o'chirish", `"${task.title}" o'chirilsinmi?`, "O'chirish", () =>
      deleteTask(task.id),
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{formatHeaderDate(today)}</Text>
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
          <Text style={styles.statValue}>{xp}</Text>
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>Bugungi vazifalar</Text>
          <Pressable onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.linkText}>Barchasi</Text>
          </Pressable>
        </View>

        {isLoading && tasks.length === 0 ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={todayTasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: spacing.md, paddingBottom: 80 }}
            renderItem={({ item }) => (
              <TaskRow task={item} variant="inline" onToggle={completeTask} onEdit={onEditTask} onDelete={onDeleteTask} />
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Bugun uchun vazifa yo'q</Text>}
          />
        )}
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
  errorText: {
    fontSize: 13,
    color: '#B4453A',
    fontWeight: '600',
    marginTop: spacing.lg,
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
