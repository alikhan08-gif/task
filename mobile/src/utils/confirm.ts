import { Alert, Platform } from 'react-native';

/**
 * react-native-web'da Alert.alert ishlamaydi (native modal yo'q),
 * shuning uchun web'da window.confirm'ga tushiriladi.
 */
export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Bekor qilish', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
