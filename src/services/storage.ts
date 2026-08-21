import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule } from '../types';

const STORAGE_KEY = '@haru/schedules/v1';

export async function loadSchedules(): Promise<Schedule[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as Schedule[]) : [];
  } catch {
    return [];
  }
}

export async function saveSchedules(schedules: Schedule[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}
