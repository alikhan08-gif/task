import React, { useState } from 'react';
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, radii } from '../theme/colors';

type Props = {
  label: string;
  mode: 'date' | 'time';
  value: Date;
  onChange: (date: Date) => void;
};

function formatDisplay(mode: 'date' | 'time', value: Date): string {
  if (mode === 'date') {
    return `${String(value.getDate()).padStart(2, '0')}.${String(value.getMonth() + 1).padStart(2, '0')}.${value.getFullYear()}`;
  }
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toTimeInputValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Telefonning o'z sana/vaqt tanlagichini ochadi (Android'da budilnikka o'xshash
 * doiraviy tanlagich) — foydalanuvchi endi qo'lda matn kiritmaydi, shuning
 * uchun eski belgilar "yopishib qolish" muammosi bo'lmaydi. Web'da (faqat shu
 * loyihani brauzerda ko'rib tekshirish uchun, haqiqiy ilova emas) brauzerning
 * o'z <input type="date"/"time"> elementiga tushiriladi, chunki bu paket
 * web'ni qo'llab-quvvatlamaydi.
 */
export function DateTimeField({ label, mode, value, onChange }: Props) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (Platform.OS === 'web') {
    const webValue = mode === 'date' ? toDateInputValue(value) : toTimeInputValue(value);
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        {React.createElement('input', {
          type: mode,
          value: webValue,
          onChange: (e: { target: { value: string } }) => {
            const next = new Date(value);
            if (mode === 'date') {
              const [y, m, d] = e.target.value.split('-').map(Number);
              if (y && m && d) {
                next.setFullYear(y, m - 1, d);
                onChange(next);
              }
            } else {
              const [h, min] = e.target.value.split(':').map(Number);
              if (!Number.isNaN(h) && !Number.isNaN(min)) {
                next.setHours(h, min, 0, 0);
                onChange(next);
              }
            }
          },
          style: webInputStyle,
        })}
      </View>
    );
  }

  const onNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setIsPickerOpen(false);
    }
    if (event.type === 'set' && selected) {
      onChange(selected);
    }
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setIsPickerOpen(true)}>
        <Text style={styles.valueText}>{formatDisplay(mode, value)}</Text>
      </Pressable>
      {isPickerOpen ? (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour
          display="default"
          onChange={onNativeChange}
        />
      ) : null}
    </View>
  );
}

const webInputStyle = {
  fontSize: 15,
  color: colors.text,
  backgroundColor: colors.surface,
  border: `1.5px solid ${colors.border}`,
  borderRadius: radii.md,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 14,
  paddingRight: 14,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const styles = StyleSheet.create({
  field: {
    gap: 6,
    flex: 1,
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
  valueText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
});
