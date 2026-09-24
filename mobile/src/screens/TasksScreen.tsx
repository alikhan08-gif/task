import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import { BackIcon, ChevronRightIcon, PlusIcon } from '../components/icons';
import { TaskRow } from '../components/TaskRow';
import { todayTasks } from '../data/mock';
import type { AppNavigationProp } from '../navigation/types';

export function TasksScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const doneCount = todayTasks.filter((t) => t.done).length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Kunlik jadval</Text>
        <Text style={styles.subheading}>
          {todayTasks.length} ta vazifa &middot; {doneCount} tasi bajarildi
        </Text>
      </View>

      <View style={styles.dateNav}>
        <Pressable style={styles.dateNavBtn} accessibilityLabel="Oldingi kun">
          <BackIcon size={18} />
        </Pressable>
        <Text style={styles.dateText}>24-sentyabr, Payshanba</Text>
        <Pressable style={styles.dateNavBtn} accessibilityLabel="Keyingi kun">
          <ChevronRightIcon size={18} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <TaskRow task={item} variant="timeline" />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm + 2 }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Bu kun uchun vazifa yo'q</Text>}
      />

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
  headerBlock: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: 100,
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
