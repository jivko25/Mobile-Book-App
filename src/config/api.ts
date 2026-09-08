import { Platform } from 'react-native';

const PRODUCTION_URL = 'https://book-app-bice-phi.vercel.app';

function getDevBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  // Android emulator → host machine localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

/** Override with EXPO_PUBLIC_API_URL for physical device or deployed backend in dev. */
export const API_BASE_URL = __DEV__ ? getDevBaseUrl() : PRODUCTION_URL;
