import { Alert, Platform } from 'react-native';

/** react-native-web'da Alert.alert ishlamaydi, shuning uchun web'da window.alert'ga tushiriladi. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
