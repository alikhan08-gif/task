import AsyncStorage from '@react-native-async-storage/async-storage';

export type Tokens = { accessToken: string; refreshToken: string };

const STORAGE_KEY = 'timeup.tokens';

let current: Tokens | null = null;
let listeners: Array<(tokens: Tokens | null) => void> = [];

export const tokenStore = {
  get current() {
    return current;
  },

  async load(): Promise<Tokens | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      current = raw ? JSON.parse(raw) : null;
    } catch {
      current = null;
    }
    // set() bilan bir xil: tinglovchilarni xabardor qilamiz, aks holda
    // saqlangan sessiya (token yangilanishga hojat qolmasdan) tiklansa ham,
    // React holati buni bilmay qolib, kirish ekranida qotib qoladi.
    listeners.forEach((listener) => listener(current));
    return current;
  },

  async set(next: Tokens | null): Promise<void> {
    current = next;
    listeners.forEach((listener) => listener(current));
    try {
      if (next) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // AsyncStorage yozib bo'lmasa ham, joriy sessiya xotirada davom etadi
    }
  },

  subscribe(listener: (tokens: Tokens | null) => void): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
