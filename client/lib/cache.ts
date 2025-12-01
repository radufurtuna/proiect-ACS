import type { Schedule } from '@/types/schedule';

// Constante pentru cache
const CACHE_KEY = 'scheduleCache';
const CACHE_TIMESTAMP_KEY = 'scheduleCacheTimestamp';

/**
 * Salvează datele schedule-urilor în localStorage
 */
export const saveScheduleCache = (data: Schedule[]): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    }
  } catch (err) {
    console.warn('Nu s-au putut salva datele în cache:', err);
  }
};

/**
 * Încarcă datele schedule-urilor din localStorage
 * @returns Datele din cache sau null dacă nu există
 */
export const loadScheduleCache = (): Schedule[] | null => {
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    console.warn('Nu s-au putut citi datele din cache:', err);
  }
  return null;
};

/**
 * Șterge cache-ul schedule-urilor din localStorage
 */
export const clearScheduleCache = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    }
  } catch (err) {
    console.warn('Nu s-a putut șterge cache-ul:', err);
  }
};

