import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { chunked } from './chunked-store';

/**
 * Where the Supabase session lives.
 *
 * The session holds a refresh token, which is effectively the whole account:
 * anyone holding it can mint access tokens indefinitely. AsyncStorage keeps it
 * as plain text in the app's sandbox — readable from a rooted or jailbroken
 * device, and on some setups out of an unencrypted backup. SecureStore puts it
 * in the iOS Keychain and the Android Keystore instead.
 */

const LIMIT = 1800; // headroom under SecureStore's 2048-byte guidance

const secureStore = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: async (key: string) => {
    // Deleting something that was never there is not a failure.
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },
};

/**
 * There is no Keychain in a browser, so web keeps AsyncStorage. The app ships
 * to phones; web is only ever the developer preview.
 */
export const sessionStorage = Platform.OS === 'web' ? AsyncStorage : chunked(secureStore, LIMIT);
