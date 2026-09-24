import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../theme/colors';
import { BackIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateTask'>;

export function CreateTaskScreen({ navigation }: Props) {
  const [reminderOn, setReminderOn] = useState(true);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Ortga"
        >
          <BackIcon size={18} />
        </Pressable>
        <Text style={styles.heading}>Yangi vazifa</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Sarlavha</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: Ingliz tili darsi"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tavsif (ixtiyoriy)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Qo'shimcha izoh..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Sana</Text>
            <TextInput style={styles.input} defaultValue="24.09.2026" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Vaqt</Text>
            <TextInput style={styles.input} defaultValue="14:00" />
          </View>
        </View>

        <Pressable style={styles.reminderRow} onPress={() => setReminderOn((v) => !v)}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.reminderTitle}>Eslatma yuborish</Text>
            <Text style={styles.reminderSubtitle}>Belgilangan vaqtdan 15 daqiqa oldin</Text>
          </View>
          <View style={[styles.toggleTrack, { backgroundColor: reminderOn ? colors.accent : colors.border }]}>
            <View style={[styles.toggleThumb, reminderOn ? { right: 3 } : { left: 3 }]} />
          </View>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryBtnText}>Saqlash</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.ghostBtnText}>Bekor qilish</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },
  form: {
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  textarea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: spacing.md,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  reminderSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleTrack: {
    width: 42,
    height: 25,
    borderRadius: radii.pill,
  },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    width: 19,
    height: 19,
    borderRadius: radii.round,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    gap: spacing.sm + 2,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 15,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    paddingVertical: 15,
  },
  ghostBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
