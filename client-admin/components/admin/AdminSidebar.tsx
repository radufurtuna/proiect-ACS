'use client';

import { useState, useEffect, useRef } from 'react';

type NavItem = {
  key: 'schedule-year1' | 'schedule-year2' | 'schedule-year3' | 'schedule-year4' | 'resources' | 'settings';
  label: string;
  badge?: string;
};

const ACADEMIC_YEARS = [
  { key: 'schedule-year1', label: 'Anul I' },
  { key: 'schedule-year2', label: 'Anul II' },
  { key: 'schedule-year3', label: 'Anul III' },
  { key: 'schedule-year4', label: 'Anul IV' },
] as const;

const PERIODS = [
  { key: 'semester1', label: 'Orar Semestrul de toamnă' },
  { key: 'assessments1', label: 'Orar evaluarea periodică nr. 1' },
  { key: 'exams', label: 'Orar Sesiunea de examinare' },
  { key: 'assessments2', label: 'Orar evaluarea periodică nr. 2' },
  { key: 'semester2', label: 'Orar Semestrul de primăvară' },
] as const;

const NAV_ITEMS: NavItem[] = [
  { key: 'resources', label: 'Utilizatori' },
  { key: 'settings', label: 'Setări' },
];

export type AdminSidebarProps = {
  activeItem?: NavItem['key'];
  onSelect?: (nav: NavItem['key'], period?: string) => void;
};

export default function AdminSidebar({ activeItem, onSelect }: AdminSidebarProps) {
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [hoveredYear, setHoveredYear] = useState<string | null>(null);
  const [periodMenuPosition, setPeriodMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const yearButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Închide meniul când se face click în afara lui
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowYearMenu(false);
      }
    };

    if (showYearMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showYearMenu]);

  // Cleanup timeout la unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        top: '73px',
        right: 0,
        height: '60px',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        boxSizing: 'border-box',
        zIndex: 999,
        borderBottom: '1px solid rgba(248, 250, 252, 0.1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
        {/* Dropdown pentru Ciclul 1 Licență - F */}
        <div
          ref={menuRef}
          style={{ position: 'relative' }}
        >
          <button
            onClick={() => {
              // Toggle meniul
              setShowYearMenu(!showYearMenu);
              // Dacă nu e selectat niciun an, selectează Anul I
              if (!activeItem?.startsWith('schedule-year')) {
                onSelect?.('schedule-year1');
              }
            }}
            style={{
              border: 'none',
              borderRadius: '0.5rem',
              backgroundColor: activeItem?.startsWith('schedule-year') ? 'rgba(248, 250, 252, 0.12)' : 'transparent',
              color: 'inherit',
              padding: '0.75rem 1.25rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.95rem',
              transition: 'background-color 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>Ciclul 1 Licență - F</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '0.5rem' }}>
              {showYearMenu ? '▲' : '▼'}
            </span>
          </button>
          
          {/* Submeniu cu anii */}
          {showYearMenu && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '100%',
                marginTop: '0.5rem',
                minWidth: '180px',
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                padding: '0.25rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                border: '1px solid rgba(248, 250, 252, 0.1)',
              }}
            >
              {ACADEMIC_YEARS.map((year) => {
                const isActive = year.key === activeItem;
                return (
                  <div
                    key={year.key}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => {
                      // Anulează timeout-ul dacă există
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                        closeTimeoutRef.current = null;
                      }
                      setHoveredYear(year.key);
                      // Calculează poziția butonului pentru submeniu
                      const button = yearButtonRefs.current[year.key];
                      if (button) {
                        const rect = button.getBoundingClientRect();
                        setPeriodMenuPosition({
                          top: rect.bottom + 4, // Sub butonul anului
                          left: rect.left, // Aliniat la stânga cu butonul
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      // Adaugă un delay înainte de a închide submeniul
                      closeTimeoutRef.current = setTimeout(() => {
                        setHoveredYear(null);
                        setPeriodMenuPosition(null);
                      }, 150); // 150ms delay
                    }}
                  >
                    <button
                      ref={(el) => {
                        yearButtonRefs.current[year.key] = el;
                      }}
                      onClick={() => {
                        onSelect?.(year.key);
                        setShowYearMenu(false); // Închide meniul după selecție
                      }}
                      style={{
                        border: 'none',
                        borderRadius: '0.375rem',
                        backgroundColor: isActive ? 'rgba(248, 250, 252, 0.12)' : 'transparent',
                        color: 'inherit',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'block',
                        width: '100%',
                        fontSize: '0.9rem',
                        transition: 'background-color 0.2s ease',
                        marginBottom: '0.25rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(248, 250, 252, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isActive ? 'rgba(248, 250, 252, 0.12)' : 'transparent';
                      }}
                    >
                      {year.label}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submeniu cu perioadele - apare la hover, poziționat fixed peste toate containerele */}
        {hoveredYear && periodMenuPosition && (
          <div
            style={{
              position: 'fixed',
              top: `${periodMenuPosition.top}px`,
              left: `${periodMenuPosition.left}px`,
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              padding: '0.25rem',
              minWidth: '220px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              zIndex: 10000,
              border: '1px solid rgba(248, 250, 252, 0.1)',
            }}
            onMouseEnter={() => {
              // Anulează timeout-ul dacă există și păstrează submeniul deschis
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              // Adaugă un delay înainte de a închide submeniul
              closeTimeoutRef.current = setTimeout(() => {
                setHoveredYear(null);
                setPeriodMenuPosition(null);
              }, 150); // 150ms delay
            }}
          >
            {PERIODS.map((period) => {
              const yearKey = hoveredYear;
              return (
                <button
                  key={period.key}
                  onClick={() => {
                    onSelect?.(yearKey as NavItem['key'], period.key);
                    setShowYearMenu(false);
                    setHoveredYear(null);
                    setPeriodMenuPosition(null);
                  }}
                  style={{
                    border: 'none',
                    borderRadius: '0.375rem',
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'block',
                    width: '100%',
                    fontSize: '0.85rem',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(248, 250, 252, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Restul butoanelor */}
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeItem;
          return (
            <button
              key={item.key}
              onClick={() => onSelect?.(item.key)}
              style={{
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: isActive ? 'rgba(248, 250, 252, 0.12)' : 'transparent',
                color: 'inherit',
                padding: '0.75rem 1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                transition: 'background-color 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(248, 250, 252, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(248, 250, 252, 0.2)',
                    color: '#f8fafc',
                    fontWeight: 600,
                    marginLeft: '0.5rem',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </nav>
  );
}

