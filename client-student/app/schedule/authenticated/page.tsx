'use client';

import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, scheduleService, assessmentScheduleService } from '@/lib/api';
import { 
  loadScheduleCache, 
  saveScheduleCache,
  loadAssessmentScheduleCache,
  saveAssessmentScheduleCache,
  filterAssessmentCachesByGroup,
  filterScheduleCachesByGroup
} from '@/lib/cache';
import { exportScheduleToPdf } from '@/lib/exportPdf';
import { exportScheduleToExcel } from '@/lib/exportExcel';
import GroupFilter from '@/components/student/GroupFilter';
import ScheduleTable from '@/components/student/ScheduleTable';
import AssessmentScheduleTable from '@/components/student/AssessmentScheduleTable';
import { scheduleWebSocket } from '@/lib/websocket';
import { headerStyles, buttonStyles, COLORS, messageStyles } from '@/utils/styles';
import type { User } from '@/types/auth';
import type { Schedule, AssessmentSchedule } from '@/types/schedule';

const SESSION_TYPE_LABELS: Record<string, string> = {
  course: 'Curs',
  seminar: 'Seminar',
  lab: 'Laborator',
};

const STATUS_LABELS: Record<string, string> = {
  normal: 'Normal',
  moved: 'Mutat',
  canceled: 'Anulat',
};

const STATUS_COLORS: Record<string, string> = {
  normal: '#0f8f4b',
  moved: '#f0ad4e',
  canceled: '#d9534f',
};

// Lățimi pentru casutele tabelului de selecție orar
const FIRST_COLUMN_WIDTH = '250px'; // Lățimea primei coloane (cu textele)
const YEAR_COLUMN_WIDTH = '90px'; // Lățimea coloanelor cu anii și casutele goale
// Lățimea totală a tabelului numerotat: prima coloană + 4 coloane cu anii
const TABLE_WIDTH = '710px'; // 250px + (4 × 90px) = 610px

export default function StudentSchedule() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [assessmentSchedules, setAssessmentSchedules] = useState<AssessmentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userGroupCode, setUserGroupCode] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false); // Flag pentru a preveni cereri duplicate
  const [showSchedule, setShowSchedule] = useState(false); // Control pentru afișarea orarului sau butoanelor
  // State pentru filtrarea schedule-urilor
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedCycleType, setSelectedCycleType] = useState<string | null>(null);
  // Ref-uri pentru valorile curente folosite în callback-ul WebSocket
  const selectedAcademicYearRef = useRef(selectedAcademicYear);
  const selectedSemesterRef = useRef(selectedSemester);
  const selectedCycleTypeRef = useRef(selectedCycleType);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<string | 'all'>('all');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Verifică dacă trebuie să afișăm evaluările periodice / sesiunea
  // (pentru orice an și pentru ciclurile F / FR)
  const isAssessmentSchedule =
    selectedSemester === 'assessments1' ||
    selectedSemester === 'assessments2' ||
    selectedSemester === 'exams';

  // Helper: filtrează orarele după grupa utilizatorului
  const filterSchedulesForUser = (data: Schedule[]) => {
    if (userGroupCode) {
      return data.filter((s) => s.group.code === userGroupCode);
    }
    return data;
  };

  // Helper: filtrează evaluările după grupa utilizatorului
  const filterAssessmentsForUser = (data: AssessmentSchedule[]) => {
    if (userGroupCode) {
      return data
        .filter((a) =>
          a.groups_composition
            .split(',')
            .map((g) => g.trim())
            .includes(userGroupCode)
        )
        .map((a) => ({
          ...a,
          groups_composition: userGroupCode, // Modifică groups_composition să afișeze doar grupa utilizatorului
        }));
    }
    return data;
  };

  // Curăță/filtrează cache-ul existent imediat ce știm grupa utilizatorului
  useEffect(() => {
    if (userGroupCode) {
      // Filtrăm toate cache-urile de orar zilnic
      filterScheduleCachesByGroup(userGroupCode);
      // Filtrăm toate cache-urile pentru evaluări periodice
      filterAssessmentCachesByGroup(userGroupCode);
    }
  }, [userGroupCode]);

  // Gestionare buton "back" din browser
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Când utilizatorul apasă "back", revenim la butoanele de ciclu
      if (showSchedule) {
        setShowSchedule(false);
        setSelectedAcademicYear(null);
        setSelectedSemester(null);
        setSelectedCycleType(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showSchedule]);

  // Verificare status conexiune online/offline
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

 
  useEffect(() => {
    const hasToken = authService.isAuthenticated();
    
   
    if (!hasToken) {
      router.replace('/schedule');
      return;
    }

    // Verifică dacă token-ul este expirat local (fără server)
    if (authService.isTokenExpired()) {
      console.error('Token expirat local, redirecționare la pagina publică');
      authService.logout();
      router.replace('/schedule');
      return;
    }

    // Dacă există token și nu este expirat local, încearcă să obțină datele utilizatorului
    // Dacă serverul este oprit, permite utilizatorului să rămână pe pagină și să folosească cache-ul
    authService
      .getCurrentUser()
      .then((user: User) => {
        // Token-ul este valid - utilizatorul este autentificat
        setIsAuthenticated(true);
        const email = authService.getUserEmail();
        setUserEmail(email);
        
        if (user.group_code) {
          setUserGroupCode(user.group_code);
          setSelectedGroup(user.group_code);
          // Salvează group_code în localStorage pentru utilizare offline
          authService.setUserGroupCode(user.group_code);
        }
      })
      .catch((err: any) => {
        // Verifică tipul erorii
        const isUnauthorized = err.response?.status === 401;
        const isNetworkError = !err.response || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error');
        
        if (isUnauthorized) {
          // Token-ul este invalid sau expirat (401) - redirecționează la pagina publică
          console.error('Token invalid sau expirat (401), redirecționare la pagina publică:', err);
          authService.logout();
          router.replace('/schedule');
        } else if (isNetworkError) {
          // Eroare de rețea (server oprit) - permite utilizatorului să rămână pe pagină
          // Folosește token-ul din localStorage și permite funcționarea offline
          console.warn('Server oprit sau eroare de rețea, se continuă în modul offline:', err);
          setIsAuthenticated(true); // Permite utilizatorului să rămână autentificat
          const email = authService.getUserEmail();
          setUserEmail(email);
          // Încearcă să obțină group_code din localStorage (salvat anterior)
          const savedGroupCode = authService.getUserGroupCode();
          if (savedGroupCode) {
            setUserGroupCode(savedGroupCode);
            setSelectedGroup(savedGroupCode);
            console.log('✓ Group code încărcat din localStorage pentru modul offline:', savedGroupCode);
          }
        } else {
          // Altă eroare - tratează ca token invalid pentru siguranță
          console.error('Eroare necunoscută la verificarea token-ului, redirecționare:', err);
          authService.logout();
          router.replace('/schedule');
        }
      });
  }, [router]);

  useEffect(() => {
    const fetchSchedules = async (showLoading = true, useCache = true) => {
      // Previne cereri duplicate simultane
      if (isFetchingRef.current) {
        console.log('⏭️ Cerere deja în curs, se ignoră...');
        return;
      }
      
      isFetchingRef.current = true;
      
      try {
        // Verifică că avem parametrii necesari pentru cache
        if (!selectedAcademicYear || !selectedSemester || !selectedCycleType) {
          if (showLoading) {
            setLoading(false);
          }
          return;
        }

        // Încarcă din cache imediat (dacă există și dacă nu avem date)
        if (useCache) {
          const cachedData = loadScheduleCache(selectedAcademicYear, selectedSemester, selectedCycleType);
          if (cachedData && cachedData.length > 0) {
            const filteredCache = filterSchedulesForUser(cachedData);
            setSchedules(filteredCache);
            setFilteredSchedules(filteredCache);
            setError(''); // Nu afișa eroare când încărcăm din cache
            if (showLoading) {
              setLoading(false);
            }
          }
        }

        // Verifică conexiunea
        if (!isOnline) {
          // Dacă nu există conexiune, folosește cache-ul
          const cachedData = loadScheduleCache(selectedAcademicYear, selectedSemester, selectedCycleType);
          if (cachedData && cachedData.length > 0) {
            const filteredCache = filterSchedulesForUser(cachedData);
            if (!useCache) {
              // Dacă nu am folosit cache-ul deja, îl setăm acum
              setSchedules(filteredCache);
              setFilteredSchedules(filteredCache);
            }
            setError('Mod offline.');
          } else {
            setError('Nu există conexiune la internet și nu există date în cache.');
          }
          if (showLoading) {
            setLoading(false);
          }
          return;
        }

        // Încearcă să încarce datele de pe server
        try {
          if (showLoading) {
          setLoading(true);
          }
          
          // Construiește parametrii de filtrare dacă sunt setate
          const filterParams: {
            academic_year?: number;
            semester?: string;
            cycle_type?: string;
          } = {};
          
          if (selectedAcademicYear !== null && selectedAcademicYear !== undefined) {
            filterParams.academic_year = selectedAcademicYear;
          }
          if (selectedSemester) {
            filterParams.semester = selectedSemester;
          }
          if (selectedCycleType) {
            filterParams.cycle_type = selectedCycleType;
          }
          
          // Folosește filtrarea doar dacă toate valorile sunt setate
          const data = await scheduleService.getAllSchedules(
            Object.keys(filterParams).length > 0 ? filterParams : undefined
          );
          const filteredData = filterSchedulesForUser(data);
          setSchedules(filteredData);
          setFilteredSchedules(filteredData);
          setError(''); // Resetează erorile la reîncărcare reușită
          // Salvează în cache după încărcare reușită (doar datele filtrate pentru utilizatorul logat, dacă e cazul)
          saveScheduleCache(filteredData, selectedAcademicYear, selectedSemester, selectedCycleType);
        } catch (err: any) {
          // Dacă există eroare, încearcă să folosească cache-ul
          const cachedData = loadScheduleCache(selectedAcademicYear, selectedSemester, selectedCycleType);
          if (cachedData && cachedData.length > 0) {
            const filteredCache = filterSchedulesForUser(cachedData);
            if (!useCache) {
              // Dacă nu am folosit cache-ul deja, îl setăm acum
              setSchedules(filteredCache);
              setFilteredSchedules(filteredCache);
            }
            setError('Nu există conexiune la server. Se afișează datele din cache (posibil vechi).');
          } else {
            setError(err.response?.data?.detail || 'Eroare la încărcarea orarului și nu există date în cache.');
          }
        } finally {
          if (showLoading) {
          setLoading(false);
        }
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Funcție pentru încărcarea evaluărilor periodice
    const fetchAssessmentSchedules = async (useCache: boolean = true, showLoading: boolean = true) => {
      if (
        selectedAcademicYear === null ||
        selectedSemester === null ||
        selectedCycleType === null
      ) {
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        // Încarcă din cache imediat (dacă există și dacă nu avem date)
        if (useCache) {
          const cachedData = loadAssessmentScheduleCache(
            selectedAcademicYear,
            selectedSemester,
            selectedCycleType
          );
          if (cachedData && cachedData.length > 0) {
            const filteredCache = filterAssessmentsForUser(cachedData);
            setAssessmentSchedules(filteredCache);
            setError(''); // Nu afișa eroare când încărcăm din cache
            if (showLoading) {
              setLoading(false);
            }
          }
        }

        // Verifică conexiunea
        if (!isOnline) {
          // Dacă nu există conexiune, folosește cache-ul
          const cachedData = loadAssessmentScheduleCache(
            selectedAcademicYear,
            selectedSemester,
            selectedCycleType
          );
          if (cachedData && cachedData.length > 0) {
            const filteredCache = filterAssessmentsForUser(cachedData);
            if (!useCache) {
              // Dacă nu am folosit cache-ul deja, îl setăm acum
              setAssessmentSchedules(filteredCache);
            }
            setError('Nu există conexiune la server. Se afișează datele din cache (posibil vechi).');
          } else {
            setError('Nu există conexiune la server și nu există date în cache.');
          }
          if (showLoading) {
            setLoading(false);
          }
          return;
        }

        // Încearcă să încarce de la server
        const data = await assessmentScheduleService.getAllAssessmentSchedules({
          academic_year: selectedAcademicYear,
          semester: selectedSemester,
          cycle_type: selectedCycleType,
        });
        const filteredData = filterAssessmentsForUser(data);
        setAssessmentSchedules(filteredData);
        setError(''); // Resetează erorile la reîncărcare reușită
        // Salvează în cache după încărcare reușită
        saveAssessmentScheduleCache(filteredData, selectedAcademicYear, selectedSemester, selectedCycleType);
      } catch (err: any) {
        console.error('Eroare la încărcarea evaluărilor periodice:', err);
        // Dacă există eroare, încearcă să folosească cache-ul
        const cachedData = loadAssessmentScheduleCache(
          selectedAcademicYear,
          selectedSemester,
          selectedCycleType
        );
        if (cachedData && cachedData.length > 0) {
          const filteredCache = filterAssessmentsForUser(cachedData);
          if (!useCache) {
            // Dacă nu am folosit cache-ul deja, îl setăm acum
            setAssessmentSchedules(filteredCache);
          }
          setError('Nu există conexiune la server. Se afișează datele din cache (posibil vechi).');
        } else {
          setError(err.response?.data?.detail || 'Eroare la încărcarea evaluărilor periodice și nu există date în cache.');
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };

    // Încărcare inițială - doar dacă există o selecție (nu încărca toate schedule-urile la start)
    // Schedule-urile vor fi încărcate când studentul selectează un an/semestru/ciclu
    if (selectedAcademicYear !== null && selectedSemester !== null && selectedCycleType !== null) {
      // Resetăm datele înainte de încărcare pentru a evita afișarea datelor vechi
      setSchedules([]);
      setFilteredSchedules([]);
      setAssessmentSchedules([]);
      setError('');
      
      // Verifică dacă trebuie să încărce evaluări periodice
      if (isAssessmentSchedule) {
        fetchAssessmentSchedules(true, true);
      } else {
        fetchSchedules(true, false);
      }
    }

    // Polling fallback - doar dacă WebSocket-ul nu este conectat (la fiecare 60 secunde)
    const pollingInterval = setInterval(() => {
      if (isOnline && !document.hidden && !scheduleWebSocket.isConnected() && !isFetchingRef.current) {
        console.log('🔄 Polling fallback (WebSocket nu este conectat)');
        fetchSchedules(false, false);
      }
    }, 60000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [isOnline, selectedAcademicYear, selectedSemester, selectedCycleType, isAssessmentSchedule]);

  // Actualizează ref-urile când se schimbă valorile
  useEffect(() => {
    selectedAcademicYearRef.current = selectedAcademicYear;
    selectedSemesterRef.current = selectedSemester;
    selectedCycleTypeRef.current = selectedCycleType;
  }, [selectedAcademicYear, selectedSemester, selectedCycleType]);

  // Conectare WebSocket - separat, doar depinde de isOnline pentru a evita conexiuni duplicate
  useEffect(() => {
    if (!isOnline) {
      return;
    }

    // Conectare WebSocket - doar dacă nu este deja conectat
    if (!scheduleWebSocket.isConnected()) {
      scheduleWebSocket.connect();
    }

    // Listener pentru actualizări de orar prin WebSocket
    const unsubscribeScheduleUpdate = scheduleWebSocket.onScheduleUpdate((updatedSchedules) => {
      if (updatedSchedules.length > 0) {
        // Am primit toate schedule-urile (refresh_all) - TREBUIE FILTRATE după semestrul curent
        const year = selectedAcademicYearRef.current;
        const semester = selectedSemesterRef.current;
        const cycle = selectedCycleTypeRef.current;
        
        // Filtrează datele primite după parametrii curenti (an, semestru, ciclu)
        let filteredByParams = updatedSchedules;
        if (year !== null && semester !== null && cycle !== null) {
          filteredByParams = updatedSchedules.filter((s) => 
            s.academic_year === year && 
            s.semester === semester && 
            s.cycle_type === cycle
          );
        }
        
        // Apoi filtrează după grupa utilizatorului (dacă e cazul)
        const filtered = filterSchedulesForUser(filteredByParams);
        setSchedules(filtered);
        setFilteredSchedules(filtered);
        
        // Salvează în cache doar dacă avem parametrii setați
        if (year !== null && semester !== null && cycle !== null) {
          saveScheduleCache(filtered, year, semester, cycle);
        }
        setError('');
        console.log('✓ Orar actualizat prin WebSocket (refresh_all)');
      } else {
        // Array gol = create/update/delete - reîncarcă datele automat
        const year = selectedAcademicYearRef.current;
        const semester = selectedSemesterRef.current;
        const cycle = selectedCycleTypeRef.current;
        
        // Reîncarcă doar dacă avem parametrii setați și dacă orarul este afișat
        if (year !== null && semester !== null && cycle !== null && showSchedule) {
          console.log('🔄 Reîncărcare automată după create/update/delete prin WebSocket');
          // Reîncarcă datele de la server (fără cache pentru a obține cele mai recente date)
          scheduleService.getAllSchedules({
            academic_year: year,
            semester: semester,
            cycle_type: cycle,
          })
            .then((data) => {
              const filtered = filterSchedulesForUser(data);
              setSchedules(filtered);
              setFilteredSchedules(filtered);
              saveScheduleCache(filtered, year, semester, cycle);
              setError('');
              console.log('✓ Orar reîncărcat după modificare prin WebSocket');
            })
            .catch((err) => {
              console.error('Eroare la reîncărcarea orarului după modificare:', err);
              // Încearcă să folosească cache-ul dacă există
              const cachedData = loadScheduleCache(year, semester, cycle);
              if (cachedData && cachedData.length > 0) {
                const filteredCache = filterSchedulesForUser(cachedData);
                setSchedules(filteredCache);
                setFilteredSchedules(filteredCache);
              }
            });
        }
      }
    });

    // Listener pentru conectare WebSocket
    const unsubscribeConnect = scheduleWebSocket.onConnect(() => {
      setWsConnected(true);
      console.log('✓ WebSocket conectat');
    });

    // Reîncărcare automată când pagina devine vizibilă din nou
    const handleVisibilityChange = () => {
      if (!document.hidden && isOnline && !scheduleWebSocket.isConnected()) {
        scheduleWebSocket.connect();
      }
    };

    // Reîncărcare automată când conexiunea revine
    const handleOnline = () => {
      if (isOnline && !scheduleWebSocket.isConnected()) {
        scheduleWebSocket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    // Cleanup - deconectează când componenta se demontă
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      unsubscribeScheduleUpdate();
      unsubscribeConnect();
      // Deconectează WebSocket când componenta se demontă pentru a evita conexiuni multiple
      scheduleWebSocket.disconnect();
    };
  }, [isOnline]); // Redus dependențele - doar isOnline

  useEffect(() => {
    let result = schedules;

    // Filtrare după grupă (utilizată în modul public; în modul logat selectedGroup este grupa utilizatorului)
    if (selectedGroup !== 'all') {
      result = result.filter((s) => s.group.code === selectedGroup);
    }

    // Filtrare după zi (dacă este activată)
    if (dayFilter !== 'all') {
      result = result.filter((s) => s.day === dayFilter);
    }

    setFilteredSchedules(result);
  }, [selectedGroup, schedules, dayFilter]);

  const uniqueGroups = useMemo(() => {
    // Pentru evaluările periodice, extragem grupele din groups_composition
    if (isAssessmentSchedule) {
      const allGroups = new Set<string>();
      assessmentSchedules.forEach((assessment) => {
        const groups = assessment.groups_composition
          .split(',')
          .map((g) => g.trim())
          .filter((g) => g.length > 0);
        groups.forEach((group) => allGroups.add(group));
      });
      return Array.from(allGroups).sort();
    }

    // Pentru orare normale, creează un map pentru a păstra ordinea grupurilor după groupId
    const groupMap = new Map<number, string>();
    for (const schedule of schedules) {
      if (!groupMap.has(schedule.group.id)) {
        groupMap.set(schedule.group.id, schedule.group.code);
      }
    }
    
    // Citește ordinea grupurilor din localStorage (aceeași cheie ca în Admin)
    const STORAGE_KEY = 'scheduleGroupsOrder';
    const savedOrder = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    let groupOrder: number[] = [];
    
    if (savedOrder) {
      try {
        groupOrder = JSON.parse(savedOrder);
      } catch (e) {
        console.error('Eroare la citirea ordinii grupurilor din localStorage:', e);
      }
    }
    
    // Obține toate groupId-urile
    const allGroupIds = Array.from(groupMap.keys());
    
    // Sortează după ordinea salvată în localStorage (ca în Admin)
    const sortedGroupIds = allGroupIds.sort((a, b) => {
      const indexA = groupOrder.indexOf(a);
      const indexB = groupOrder.indexOf(b);
      
      // Dacă ambele sunt în ordinea salvată, sortăm după poziția lor
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Dacă doar unul este în ordinea salvată, îl punem primul
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Dacă niciunul nu este în ordinea salvată, sortăm după ID (pentru grupe noi)
      return a - b;
    });
    
    return sortedGroupIds.map((groupId) => groupMap.get(groupId)!);
  }, [schedules, assessmentSchedules, isAssessmentSchedule]);

  const handleLogout = () => {
    setIsLoggingOut(true); // Previne re-renderizarea în timpul logout-ului
    authService.logout();
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserGroupCode(null);
    setSelectedGroup('all');
    setShowSchedule(false);
    setDayFilter('all');
    // Redirecționează la pagina de login după logout
    router.replace('/login');
  };

  // Închide meniul de export când se face click în afara lui
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExportPDF = async () => {
    if (filteredSchedules.length === 0) {
      alert('Nu există date de exportat.');
      return;
    }

    setShowExportMenu(false);

    try {
      // Calculează grupele care trebuie exportate (din schedule-urile filtrate)
      const groupsToExport = selectedGroup === 'all' 
        ? uniqueGroups 
        : [selectedGroup];
      
      await exportScheduleToPdf(schedules, groupsToExport, selectedGroup);
    } catch (error: any) {
      console.error('Eroare la export:', error);
      alert(error.message || 'Eroare la exportul PDF. Asigură-te că biblioteca jsPDF este instalată.');
    }
  };

  const handleExportExcel = async () => {
    if (filteredSchedules.length === 0) {
      alert('Nu există date de exportat.');
      return;
    }

    setShowExportMenu(false);

    try {
      // Calculează grupele care trebuie exportate (din schedule-urile filtrate)
      const groupsToExport = selectedGroup === 'all' 
        ? uniqueGroups 
        : [selectedGroup];
      
      await exportScheduleToExcel(schedules, groupsToExport, selectedGroup);
    } catch (error: any) {
      console.error('Eroare la export:', error);
      alert(error.message || 'Eroare la exportul Excel. Asigură-te că biblioteca xlsx este instalată.');
    }
  };

  // Filtrare rapidă pe ziua curentă (doar pentru utilizator autenticat)
  const handleToggleTodayFilter = () => {
    if (dayFilter === 'all') {
      const today = new Date().getDay(); // 0 = Duminică, 1 = Luni, ...
      const dayMap: Record<number, string> = {
        1: 'Luni',
        2: 'Marți',
        3: 'Miercuri',
        4: 'Joi',
        5: 'Vineri',
        6: 'Sâmbătă',
      };
      const todayName = dayMap[today];
      if (todayName) {
        setDayFilter(todayName);
      }
    } else {
      setDayFilter('all');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background }}>
      <header
        style={headerStyles.header}
      >
        <div>
          <h1 style={headerStyles.title}>
            Orar 
          </h1>
        
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isLoggingOut && (
            <>
              {userEmail && (
                <span style={{ 
                  color: COLORS.textSecondary, 
                  fontSize: '0.9rem',
                  fontWeight: '400',
                }}>
                  {userEmail}
                </span>
              )}
              <button
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.dangerHover;
                  e.currentTarget.style.boxShadow = COLORS.shadow;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.danger;
                  e.currentTarget.style.boxShadow = COLORS.shadowSm;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                style={{
                  ...buttonStyles.danger,
                }}
              >
                Deconectare
              </button>
            </>
          )}
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {error && (
          <div style={messageStyles.error}>
            {error}
          </div>
        )}

        {/* Container cu butoane pentru selectarea orarului - DOAR pentru utilizatorii autentificați */}
        {!showSchedule && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              padding: '2rem',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
              maxWidth: '1200px',
            }}
          >
            {/* Semestrul de toamnă */}
            <button
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
              }}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => {
                setSelectedAcademicYear(1);
                setSelectedSemester('semester1');
                setSelectedCycleType('F');
                setShowSchedule(true);
                window.history.pushState({ showSchedule: true }, '', window.location.href);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px', 
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: '500', marginBottom: '0.25rem' }}>Semestrul</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.3' }}>Orar Semestrul de toamnă</div>
                </div>
              </div>
            </button>

            {/* Evaluarea periodică nr. 1 */}
            <button
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
              }}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => {
                setSelectedAcademicYear(1);
                setSelectedSemester('assessments1');
                setSelectedCycleType('F');
                setShowSchedule(true);
                window.history.pushState({ showSchedule: true }, '', window.location.href);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px', 
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: '500', marginBottom: '0.25rem' }}>Evaluare</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.3' }}>Orar evaluarea periodică nr. 1</div>
                </div>
              </div>
            </button>

            {/* Evaluarea periodică nr. 2 */}
            <button
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.15)';
              }}
              style={{
                backgroundColor: '#a855f7',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => {
                setSelectedAcademicYear(1);
                setSelectedSemester('assessments2');
                setSelectedCycleType('F');
                setShowSchedule(true);
                window.history.pushState({ showSchedule: true }, '', window.location.href);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px', 
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: '500', marginBottom: '0.25rem' }}>Evaluare</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.3' }}>Orar evaluarea periodică nr. 2</div>
                </div>
              </div>
            </button>

            {/* Sesiunea de examinare */}
            <button
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
              }}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => {
                setSelectedAcademicYear(1);
                setSelectedSemester('exams');
                setSelectedCycleType('F');
                setShowSchedule(true);
                window.history.pushState({ showSchedule: true }, '', window.location.href);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px', 
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: '500', marginBottom: '0.25rem' }}>Sesiune</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.3' }}>Orar Sesiunea de examinare</div>
                </div>
              </div>
            </button>

            {/* Semestrul de primăvară */}
            <button
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.15)';
              }}
              style={{
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => {
                setSelectedAcademicYear(1);
                setSelectedSemester('semester2');
                setSelectedCycleType('F');
                setShowSchedule(true);
                window.history.pushState({ showSchedule: true }, '', window.location.href);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px', 
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: '500', marginBottom: '0.25rem' }}>Semestrul</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.3' }}>Orar Semestrul de primăvară</div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Orarul - se afișează doar când showSchedule este true */}
        {showSchedule && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%', marginBottom: '1rem', marginTop: '0', position: 'relative' }}>
          {/* Filtrare rapidă pe ziua curentă (orarul de azi) - doar pentru orare normale, nu pentru evaluări */}
          {!isAssessmentSchedule ? (
            <button
              onClick={handleToggleTodayFilter}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primaryHover;
                e.currentTarget.style.boxShadow = COLORS.shadow;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.boxShadow = COLORS.shadowSm;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              style={{
                ...buttonStyles.primary,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {dayFilter === 'all' ? 'Orarul de azi' : dayFilter}
            </button>
          ) : null}
          
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={filteredSchedules.length === 0}
              onMouseEnter={(e) => {
                if (filteredSchedules.length > 0) {
                  e.currentTarget.style.backgroundColor = COLORS.successHover;
                  e.currentTarget.style.boxShadow = COLORS.shadow;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (filteredSchedules.length > 0) {
                  e.currentTarget.style.backgroundColor = COLORS.success;
                  e.currentTarget.style.boxShadow = COLORS.shadowSm;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
              style={{
                ...(filteredSchedules.length === 0 ? buttonStyles.disabled : {}),
                ...buttonStyles.success,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: filteredSchedules.length === 0 ? COLORS.textSecondary : COLORS.success,
                opacity: filteredSchedules.length === 0 ? 0.6 : 1,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              
            </button>
            {showExportMenu && filteredSchedules.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  boxShadow: COLORS.shadowLg,
                  zIndex: 1000,
                  minWidth: '150px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={handleExportPDF}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: COLORS.textPrimary,
                    borderBottom: `1px solid ${COLORS.borderLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.backgroundLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: COLORS.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.backgroundLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Se încarcă...</div>
        ) : isAssessmentSchedule ? (
          // Afișează evaluările periodice
          assessmentSchedules.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                color: '#666',
              }}
            >
              Nu există evaluări periodice în sistem.
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <h2
                style={{
                  textAlign: 'center',
                  marginBottom: '1rem',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: '100',
                }}
              >
                {(() => {
                  const yearLabel = selectedAcademicYear === 1 ? 'I' : selectedAcademicYear === 2 ? 'II' : selectedAcademicYear === 3 ? 'III' : selectedAcademicYear === 4 ? 'IV' : selectedAcademicYear || 'I';
                  const cycleLabel = selectedCycleType === 'F' ? 'Licență - frecvență' : selectedCycleType === 'FR' ? 'Licență - frecvență redusă' : selectedCycleType === 'masterat' ? 'Masterat' : '';
                  if (selectedSemester === 'assessments1') {
                    return `Orar evaluarea periodică nr. 1 - Anul ${yearLabel}${cycleLabel ? ` - ${cycleLabel}` : ''}`;
                  } else if (selectedSemester === 'assessments2') {
                    return `Orar evaluarea periodică nr. 2 - Anul ${yearLabel}${cycleLabel ? ` - ${cycleLabel}` : ''}`;
                  } else if (selectedSemester === 'exams') {
                    return `Orar Sesiunea de examinare - Anul ${yearLabel}${cycleLabel ? ` - ${cycleLabel}` : ''}`;
                  }
                  return `Orar evaluarea periodică - Anul ${yearLabel}${cycleLabel ? ` - ${cycleLabel}` : ''}`;
                })()}
              </h2>
              <AssessmentScheduleTable
                assessmentSchedules={assessmentSchedules}
                selectedGroup={selectedGroup}
              />
            </div>
          )
        ) : filteredSchedules.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              color: '#666',
            }}
          >
            {schedules.length === 0
              ? 'Nu există orare în sistem.'
              : 'Nu există orare pentru grupul selectat.'}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <h2
              style={{
                textAlign: 'center',
                marginBottom: '1rem',
                color: '#000',
                fontSize: '1rem',
                fontWeight: '100',
              }}
            >
              {(() => {
                const yearLabel = selectedAcademicYear === 1 ? 'I' : selectedAcademicYear === 2 ? 'II' : selectedAcademicYear === 3 ? 'III' : selectedAcademicYear === 4 ? 'IV' : selectedAcademicYear || 'I';
                const semesterLabel = selectedSemester === 'semester1' ? 'toamnă' : selectedSemester === 'semester2' ? 'primăvară' : '';
                const cycleLabel = selectedCycleType === 'F' ? ' - Licență frecvență' : selectedCycleType === 'FR' ? ' - Licență frecvență redusă' : selectedCycleType === 'masterat' ? ' - Masterat' : '';
                if (semesterLabel) {
                  return `Orar semestrul de ${semesterLabel} anul ${yearLabel}${cycleLabel}`;
                }
                return `Orar - Anul ${yearLabel}${cycleLabel}`;
              })()}
            </h2>
            <ScheduleTable
              schedules={filteredSchedules}
              selectedGroup={selectedGroup}
              uniqueGroups={uniqueGroups}
              dayFilter={dayFilter}
            />
          </div>
        )}
        </>
      )}
      </main>
    </div>
  );
}

