import { Alert, Platform } from 'react-native';

/**
 * 웹에서는 React Native의 Alert.alert가 눈에 띄지 않는 경우가 많아
 * 동일한 메시지를 window.alert로 표시합니다.
 */
export function showAppAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message ?? '');
  }
}
