import type { Schedule, AssessmentSchedule } from '@/types/schedule';

// Constante pentru cache
const CACHE_KEY = 'scheduleCache';
const CACHE_TIMESTAMP_KEY = 'scheduleCacheTimestamp';
const SCHEDULE_CACHE_KEY_PREFIX = 'scheduleCache_';
const SCHEDULE_CACHE_TIMESTAMP_KEY_PREFIX = 'scheduleCacheTimestamp_';
const ASSESSMENT_CACHE_KEY_PREFIX = 'assessmentCache_';
const ASSESSMENT_CACHE_TIMESTAMP_KEY_PREFIX = 'assessmentCacheTimestamp_';

/**
 * Creează o cheie de cache pentru orar zilnic bazată pe parametri
 */
const getScheduleCacheKey = (academicYear: number, semester: string, cycleType: string | null): string => {
  return `${SCHEDULE_CACHE_KEY_PREFIX}${academicYear}_${semester}_${cycleType || 'null'}`;
};

const getScheduleCacheTimestampKey = (academicYear: number, semester: string, cycleType: string | null): string => {
  return `${SCHEDULE_CACHE_TIMESTAMP_KEY_PREFIX}${academicYear}_${semester}_${cycleType || 'null'}`;
};

/**
 * Creează o cheie de cache pentru evaluări periodice bazată pe parametri
 */
const getAssessmentCacheKey = (academicYear: number, semester: string, cycleType: string | null): string => {
  return `${ASSESSMENT_CACHE_KEY_PREFIX}${academicYear}_${semester}_${cycleType || 'null'}`;
};

const getAssessmentCacheTimestampKey = (academicYear: number, semester: string, cycleType: string | null): string => {
  return `${ASSESSMENT_CACHE_TIMESTAMP_KEY_PREFIX}${academicYear}_${semester}_${cycleType || 'null'}`;
};

/**
 * Salvează datele schedule-urilor în localStorage
 * Cache-ul este specific pentru fiecare combinație de parametri (academicYear, semester, cycleType)
 */
export const saveScheduleCache = (
  data: Schedule[],
  academicYear: number,
  semester: string,
  cycleType: string | null
): void => {
  try {
    if (typeof window !== 'undefined') {
      const cacheKey = getScheduleCacheKey(academicYear, semester, cycleType);
      const timestampKey = getScheduleCacheTimestampKey(academicYear, semester, cycleType);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
      console.log(`💾 Cache salvat: ${cacheKey} (${data.length} intrări)`);
    }
  } catch (err) {
    console.warn('Nu s-au putut salva datele în cache:', err);
  }
};

/**
 * Încarcă datele schedule-urilor din localStorage
 * @returns Datele din cache sau null dacă nu există
 */
export const loadScheduleCache = (
  academicYear: number | null,
  semester: string | null,
  cycleType: string | null
): Schedule[] | null => {
  try {
    if (typeof window !== 'undefined') {
      // Dacă nu avem parametrii, nu putem încărca cache specific
      if (academicYear === null || semester === null || cycleType === null) {
        console.log('⚠️ Cache: Parametri lipsă pentru încărcare');
        return null;
      }
      const cacheKey = getScheduleCacheKey(academicYear, semester, cycleType);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`📦 Cache încărcat: ${cacheKey} (${data.length} intrări)`);
        return data;
      } else {
        console.log(`⚠️ Cache nu există: ${cacheKey}`);
      }
    }
  } catch (err) {
    console.warn('Nu s-au putut citi datele din cache:', err);
  }
  return null;
};

/**
 * Șterge cache-ul schedule-urilor din localStorage pentru o combinație specifică
 */
export const clearScheduleCache = (
  academicYear: number,
  semester: string,
  cycleType: string | null
): void => {
  try {
    if (typeof window !== 'undefined') {
      const cacheKey = getScheduleCacheKey(academicYear, semester, cycleType);
      const timestampKey = getScheduleCacheTimestampKey(academicYear, semester, cycleType);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(timestampKey);
    }
  } catch (err) {
    console.warn('Nu s-a putut șterge cache-ul:', err);
  }
};

/**
 * Șterge toate cache-urile schedule-urilor
 */
export const clearAllScheduleCache = (): void => {
  try {
    if (typeof window !== 'undefined') {
      // Șterge cheia veche (pentru compatibilitate înapoi)
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      
      // Găsește toate cheile care încep cu prefixul
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(SCHEDULE_CACHE_KEY_PREFIX) || key.startsWith(SCHEDULE_CACHE_TIMESTAMP_KEY_PREFIX))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (err) {
    console.warn('Nu s-au putut șterge toate cache-urile:', err);
  }
};

/**
 * Filtrează toate cache-urile de orar zilnic pentru a păstra doar grupele specificate
 * Folosit pentru utilizatori autentificați, astfel încât cache-ul să nu conțină alte grupe.
 */
export const filterScheduleCachesByGroup = (groupCode: string): void => {
  try {
    if (typeof window === 'undefined') return;
    const keysToProcess: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SCHEDULE_CACHE_KEY_PREFIX)) {
        keysToProcess.push(key);
      }
    }

    keysToProcess.forEach((key) => {
      const cached = localStorage.getItem(key);
      if (!cached) return;

      try {
        const schedules: Schedule[] = JSON.parse(cached);
        const filtered = schedules.filter((s) => s.group.code === groupCode);
        
        if (filtered.length === 0) {
          // Dacă nu mai sunt date după filtrare, șterge cache-ul
          localStorage.removeItem(key);
          // Șterge și timestamp-ul asociat
          const timestampKey = key.replace(SCHEDULE_CACHE_KEY_PREFIX, SCHEDULE_CACHE_TIMESTAMP_KEY_PREFIX);
          localStorage.removeItem(timestampKey);
        } else {
          // Salvează datele filtrate
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch (err) {
        console.warn(`Eroare la procesarea cache-ului ${key}:`, err);
      }
    });
  } catch (err) {
    console.warn('Nu s-au putut filtra cache-urile de orar:', err);
  }
};

/**
 * Salvează datele evaluărilor periodice în localStorage
 * Cache-ul este specific pentru fiecare combinație de parametri
 */
export const saveAssessmentScheduleCache = (
  data: AssessmentSchedule[],
  academicYear: number,
  semester: string,
  cycleType: string | null
): void => {
  try {
    if (typeof window !== 'undefined') {
      const cacheKey = getAssessmentCacheKey(academicYear, semester, cycleType);
      const timestampKey = getAssessmentCacheTimestampKey(academicYear, semester, cycleType);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
    }
  } catch (err) {
    console.warn('Nu s-au putut salva datele evaluărilor periodice în cache:', err);
  }
};

/**
 * Încarcă datele evaluărilor periodice din localStorage
 * @returns Datele din cache sau null dacă nu există
 */
export const loadAssessmentScheduleCache = (
  academicYear: number,
  semester: string,
  cycleType: string | null
): AssessmentSchedule[] | null => {
  try {
    if (typeof window !== 'undefined') {
      const cacheKey = getAssessmentCacheKey(academicYear, semester, cycleType);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    console.warn('Nu s-au putut citi datele evaluărilor periodice din cache:', err);
  }
  return null;
};

/**
 * Șterge cache-ul evaluărilor periodice din localStorage
 */
export const clearAssessmentScheduleCache = (
  academicYear: number,
  semester: string,
  cycleType: string | null
): void => {
  try {
    if (typeof window !== 'undefined') {
      const cacheKey = getAssessmentCacheKey(academicYear, semester, cycleType);
      const timestampKey = getAssessmentCacheTimestampKey(academicYear, semester, cycleType);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(timestampKey);
    }
  } catch (err) {
    console.warn('Nu s-a putut șterge cache-ul evaluărilor periodice:', err);
  }
};

/**
 * Șterge toate cache-urile evaluărilor periodice
 */
export const clearAllAssessmentScheduleCache = (): void => {
  try {
    if (typeof window !== 'undefined') {
      // Găsește toate cheile care încep cu prefixul
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(ASSESSMENT_CACHE_KEY_PREFIX) || key.startsWith(ASSESSMENT_CACHE_TIMESTAMP_KEY_PREFIX))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (err) {
    console.warn('Nu s-au putut șterge toate cache-urile evaluărilor periodice:', err);
  }
};

/**
 * Filtrează toate cache-urile de evaluări periodice pentru a păstra doar grupele specificate
 * Folosit pentru utilizatori autentificați, astfel încât cache-ul să nu conțină alte grupe.
 */
export const filterAssessmentCachesByGroup = (groupCode: string): void => {
  try {
    if (typeof window === 'undefined') return;
    const keysToProcess: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(ASSESSMENT_CACHE_KEY_PREFIX)) {
        keysToProcess.push(key);
      }
    }

    keysToProcess.forEach((key) => {
      const cached = localStorage.getItem(key);
      if (!cached) {
        return;
      }
      try {
        const data: AssessmentSchedule[] = JSON.parse(cached);
        const filtered = data.filter((a) =>
          a.groups_composition
            .split(',')
            .map((g) => g.trim())
            .includes(groupCode)
        );
        if (filtered.length > 0) {
          localStorage.setItem(key, JSON.stringify(filtered));
        } else {
          // Dacă nu mai rămâne nimic, șterge cache-ul
          localStorage.removeItem(key);
          const tsKey = key.replace(ASSESSMENT_CACHE_KEY_PREFIX, ASSESSMENT_CACHE_TIMESTAMP_KEY_PREFIX);
          localStorage.removeItem(tsKey);
        }
      } catch (err) {
        console.warn('Nu s-a putut filtra cache-ul evaluărilor:', err);
      }
    });
  } catch (err) {
    console.warn('Nu s-au putut filtra cache-urile evaluărilor periodice:', err);
  }
};
