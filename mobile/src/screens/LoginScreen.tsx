import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { MarkIcon } from '../components/icons';
import { useAuth } from '../api/AuthContext';

export function LoginScreen() {
  const { login, register, isLoading, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    if (!email || !password) return;
    if (mode === 'login') {
      login(email, password);
    } else {
      register(email, password, 'Asia/Tashkent');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <MarkIcon size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.brandName}>TimeUp</Text>
      </View>

      <View style={styles.center}>
        <View style={{ gap: spacing.xs }}>
          <Text style={styles.heading}>{mode === 'login' ? 'Xush kelibsiz' : "Ro'yxatdan o'tish"}</Text>
          <Text style={styles.subheading}>Intizom — soddalik va rag'batlantirish orqali</Text>
        </View>

        <View style={{ gap: spacing.lg, marginTop: spacing.xxl }}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="ism@pochta.uz"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Parol</Text>
            <TextInput
              style={styles.input}
              placeholder="Kamida 8 ta belgi"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={onSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}</Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
              onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              <Text style={styles.ghostBtnText}>
                {mode === 'login' ? "Hisobingiz yo'qmi? Ro'yxatdan o'tish" : 'Hisobingiz bormi? Kirish'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Kirish orqali siz Foydalanish shartlari va Maxfiylik siyosatiga rozilik bildirasiz
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xxl,
    paddingTop: 56,
    paddingBottom: spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
  errorText: {
    fontSize: 13,
    color: '#B4453A',
    fontWeight: '600',
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
    paddingVertical: 13.5,
  },
  ghostBtnText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
