'use client';

import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, scheduleService } from '@/lib/api';
import { loadScheduleCache, saveScheduleCache } from '@/lib/cache';
import { exportScheduleToPdf } from '@/lib/exportPdf';
import { exportScheduleToExcel } from '@/lib/exportExcel';
import GroupFilter from '@/components/student/GroupFilter';
import CycleFButton from '@/components/student/CycleFButton';
import CycleFRButton from '@/components/student/CycleFRButton';
import CycleMasteratButton from '@/components/student/CycleMasteratButton';
import ScheduleTable from '@/components/student/ScheduleTable';
import { scheduleWebSocket } from '@/lib/websocket';
import type { Schedule } from '@/types/schedule';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false); // Flag pentru a preveni cereri duplicate
  const [showSchedule, setShowSchedule] = useState(false); // Control pentru afișarea orarului sau butoanelor
  const [openCycles, setOpenCycles] = useState<Set<'F' | 'FR' | 'masterat'>>(new Set()); // Set pentru a ține minte butoanele deschise

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
    setIsAuthenticated(authService.isAuthenticated());

    const fetchSchedules = async (showLoading = true, useCache = true) => {
      // Previne cereri duplicate simultane
      if (isFetchingRef.current) {
        console.log('⏭️ Cerere deja în curs, se ignoră...');
        return;
      }
      
      isFetchingRef.current = true;
      
      try {
        // Încarcă din cache imediat (dacă există și dacă nu avem date)
        if (useCache) {
          const cachedData = loadScheduleCache();
          if (cachedData && cachedData.length > 0) {
            setSchedules(cachedData);
            setFilteredSchedules(cachedData);
            setError(''); // Nu afișa eroare când încărcăm din cache
            if (showLoading) {
              setLoading(false);
            }
          }
        }

        // Verifică conexiunea
        if (!isOnline) {
          // Dacă nu există conexiune, folosește cache-ul
          const cachedData = loadScheduleCache();
          if (cachedData && cachedData.length > 0) {
            if (!useCache) {
              // Dacă nu am folosit cache-ul deja, îl setăm acum
              setSchedules(cachedData);
              setFilteredSchedules(cachedData);
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
          const data = await scheduleService.getAllSchedules();
          setSchedules(data);
          setFilteredSchedules(data);
          setError(''); // Resetează erorile la reîncărcare reușită
          // Salvează în cache după încărcare reușită
          saveScheduleCache(data);
        } catch (err: any) {
          // Dacă există eroare, încearcă să folosească cache-ul
          const cachedData = loadScheduleCache();
          if (cachedData && cachedData.length > 0) {
            if (!useCache) {
              // Dacă nu am folosit cache-ul deja, îl setăm acum
              setSchedules(cachedData);
              setFilteredSchedules(cachedData);
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

    // Încărcare inițială - încearcă cache-ul primul, apoi serverul
    fetchSchedules(true, true);

    // Conectare WebSocket pentru actualizări în timp real
    if (isOnline) {
      scheduleWebSocket.connect();
      
      // Listener pentru actualizări de orar prin WebSocket
      const unsubscribeScheduleUpdate = scheduleWebSocket.onScheduleUpdate((updatedSchedules) => {
        if (updatedSchedules.length > 0) {
          // Am primit toate schedule-urile (refresh_all)
          setSchedules(updatedSchedules);
          setFilteredSchedules(updatedSchedules);
          saveScheduleCache(updatedSchedules);
          setError('');
          console.log('✓ Orar actualizat prin WebSocket');
        } else {
          // Array gol = trebuie să reîncărcăm manual (pentru create/update/delete individual)
          // Dar doar dacă nu suntem deja în proces de fetch
          if (!isFetchingRef.current) {
            fetchSchedules(false, false);
          }
        }
      });

      // Listener pentru conectare WebSocket
      const unsubscribeConnect = scheduleWebSocket.onConnect(() => {
        setWsConnected(true);
        console.log('✓ WebSocket conectat');
      });

      // Polling fallback - doar dacă WebSocket-ul nu este conectat (la fiecare 60 secunde)
      // Redus frecvența pentru a evita cereri excesive
      const pollingInterval = setInterval(() => {
        if (isOnline && !document.hidden && !scheduleWebSocket.isConnected() && !isFetchingRef.current) {
          // Dacă WebSocket-ul nu este conectat, folosește polling ca fallback
          console.log('🔄 Polling fallback (WebSocket nu este conectat)');
          fetchSchedules(false, false);
        }
      }, 60000); // 60 secunde pentru fallback (mărit de la 30)

      // Reîncărcare automată când pagina devine vizibilă din nou (doar o dată)
      let visibilityHandled = false;
      const handleVisibilityChange = () => {
        if (!document.hidden && isOnline && !visibilityHandled) {
          visibilityHandled = true;
          // Reconectează WebSocket dacă s-a pierdut conexiunea
          if (!scheduleWebSocket.isConnected()) {
            scheduleWebSocket.connect();
          }
          fetchSchedules(false, false);
          // Reset flag după 2 secunde pentru a permite o nouă reîncărcare la următoarea vizibilitate
          setTimeout(() => { visibilityHandled = false; }, 2000);
        }
      };

      // Reîncărcare automată când conexiunea revine (doar o dată)
      let onlineHandled = false;
      const handleOnline = () => {
        if (isOnline && !onlineHandled) {
          onlineHandled = true;
          // Reconectează WebSocket când conexiunea revine
          if (!scheduleWebSocket.isConnected()) {
            scheduleWebSocket.connect();
          }
          fetchSchedules(false, false);
          setTimeout(() => { onlineHandled = false; }, 2000);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);

      // Cleanup
      return () => {
        clearInterval(pollingInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        unsubscribeScheduleUpdate();
        unsubscribeConnect();
        scheduleWebSocket.disconnect();
      };
    } else {
      // Dacă nu există conexiune, păstrează polling-ul ca fallback
      const pollingInterval = setInterval(() => {
        if (isOnline && !document.hidden) {
          fetchSchedules(false, false);
        }
      }, 30000);

      return () => {
        clearInterval(pollingInterval);
      };
    }
  }, [isOnline]);

  useEffect(() => {
    if (selectedGroup === 'all') {
      setFilteredSchedules(schedules);
    } else {
      setFilteredSchedules(schedules.filter((s) => s.group.code === selectedGroup));
    }
  }, [selectedGroup, schedules]);

  const uniqueGroups = useMemo(() => {
    // Creează un map pentru a păstra ordinea grupurilor după groupId
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
  }, [schedules]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header
        style={{
          backgroundColor: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'black' }}>
            Orar 
          </h1>
        
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAuthenticated ? (
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Logout
              </button>
          ) : (
            <button
              onClick={handleLogin}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#343a40',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Autentificare
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        )}

        {/* Container cu butoane - se afișează inițial */}
        {!showSchedule && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              padding: '2rem',
              width: TABLE_WIDTH,
              margin: '0 auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <tbody>
                <CycleFButton
                  isOpen={openCycles.has('F')}
                  onToggle={() => {
                    setOpenCycles((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has('F')) {
                        newSet.delete('F');
                      } else {
                        newSet.add('F');
                      }
                      return newSet;
                    });
                  }}
                  onScheduleSelect={(year, period, cellNumber) => {
                    // Doar butonul numerotat cu 1 deschide orarul existent
                    if (cellNumber === 1) {
                      console.log('Selected:', 'F', year, period, 'cellNumber:', cellNumber);
                    setShowSchedule(true);
                    } else {
                      // Pentru celelalte butoane, afișează un mesaj că orarul nu este disponibil încă
                      alert('Orarul pentru această selecție nu este disponibil încă.');
                    }
                  }}
                />
                <CycleFRButton
                  isOpen={openCycles.has('FR')}
                  onToggle={() => {
                    setOpenCycles((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has('FR')) {
                        newSet.delete('FR');
                      } else {
                        newSet.add('FR');
                      }
                      return newSet;
                    });
                  }}
                  onScheduleSelect={(year, period, cellNumber) => {
                    // Pentru FR, toate butoanele afișează mesaj că orarul nu este disponibil încă
                    alert('Orarul pentru această selecție nu este disponibil încă.');
                  }}
                />
                <CycleMasteratButton
                  isOpen={openCycles.has('masterat')}
                  onToggle={() => {
                    setOpenCycles((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has('masterat')) {
                        newSet.delete('masterat');
                      } else {
                        newSet.add('masterat');
                      }
                      return newSet;
                    });
                  }}
                />
              </tbody>
            </table>
          </div>
        )}

        {/* Orarul - se afișează doar când showSchedule este true */}
        {showSchedule && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%', marginBottom: '1rem', marginTop: '0', position: 'relative' }}>
          {/* Componentă de filtrare pentru grupe */}
          <GroupFilter
            groups={uniqueGroups}
            selectedGroup={selectedGroup}
            onGroupSelect={setSelectedGroup}
          />
          
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={filteredSchedules.length === 0}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filteredSchedules.length === 0 ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: filteredSchedules.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: filteredSchedules.length === 0 ? 0.6 : 1,
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
                  marginTop: '0.25rem',
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '150px',
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
                    color: '#000',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
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
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
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
              Orar semestrul de toamnă anul I
            </h2>
            <ScheduleTable
              schedules={filteredSchedules}
              selectedGroup={selectedGroup}
              uniqueGroups={uniqueGroups}
            />
          </div>
        )}
        </>
      )}
      </main>
    </div>
  );
}

