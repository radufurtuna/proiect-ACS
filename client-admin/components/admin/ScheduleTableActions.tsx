'use client';

/**
 * ScheduleTableActions - Component pentru butoanele de editare/acțiune ale tabelului
 * 
 * Acest component conține toate butoanele de acțiune pentru tabelul de orar:
 * - Buton "Adaugă grupă" (+)
 * - Buton "Salvează" (💾)
 * - Buton "Șterge" (🗑️) cu meniu dropdown pentru ștergerea grupelor
 * - Buton "Anulează" (✕)
 * 
 * Componentul primește toate handlers-urile și stările necesare ca props.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { GroupColumn } from './ScheduleGrid.types';

interface ScheduleTableActionsProps {
  groups: GroupColumn[];
  loading: boolean;
  showDeleteMenu: boolean;
  deleteMenuRef: React.RefObject<HTMLDivElement | null>;
  onAddGroup: () => void;
  onSave: () => void;
  onDeleteClick: () => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteAllGroups: () => void;
  onCancel: () => void;
  academicYear: number;
  selectedGroupId: string | null;
  onGroupFilterChange: (groupId: string | null) => void;
  // Opțional: ascunde butonul de ștergere (folosit pentru evaluări periodice)
  showDeleteButton?: boolean;
  // Opțional: tipul de orar (pentru textul dinamic)
  period?: string | null;
  cycleType?: string | null;
}

export default function ScheduleTableActions({
  groups,
  loading,
  showDeleteMenu,
  deleteMenuRef,
  onAddGroup,
  onSave,
  onDeleteClick,
  onDeleteGroup,
  onDeleteAllGroups,
  onCancel,
  academicYear,
  selectedGroupId,
  onGroupFilterChange,
  showDeleteButton = true,
  period = null,
  cycleType = null,
}: ScheduleTableActionsProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Închide meniul când se dă click în afara lui
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterMenu]);

  const handleGroupSelect = (groupId: string | null) => {
    onGroupFilterChange(groupId);
    setShowFilterMenu(false);
  };

  // Filtrează grupele care au nume (nu sunt goale)
  const availableGroups = groups.filter((group) => group.groupName.trim());
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '0.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          style={{
            padding: '0.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
          }}
          title="Adaugă"
          onClick={onAddGroup}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          style={{
            padding: '0.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            opacity: loading ? 0.6 : 1,
          }}
          title="Salvare"
          onClick={onSave}
          disabled={loading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </button>
        {showDeleteButton && (
          <div style={{ position: 'relative' }} ref={deleteMenuRef}>
            <button
              style={{
                padding: '0.5rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
              }}
              title="Șterge"
              onClick={onDeleteClick}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
            {showDeleteMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.25rem',
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '180px',
                }}
              >
                {groups.filter((group) => group.groupName.trim()).length > 0 && (
                  <>
                    <div
                      style={{
                        padding: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#666',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      Șterge grupă:
                    </div>
                    {groups
                      .filter((group) => group.groupName.trim())
                      .map((group) => (
                        <button
                          key={group.id}
                          onClick={() => onDeleteGroup(group.id)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            textAlign: 'left',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: '#000',
                            borderBottom: '1px solid #eee',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {group.groupName}
                        </button>
                      ))}
                  </>
                )}
                <button
                  onClick={onDeleteAllGroups}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#ef4444',
                    fontWeight: 'bold',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Șterge toate grupele
                </button>
              </div>
            )}
          </div>
        )}
        <button
          style={{
            padding: '0.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            opacity: loading ? 0.6 : 1,
          }}
          title="Anulează"
          onClick={onCancel}
          disabled={loading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        {/* Buton de filtrare mutat după Anulează */}
        {availableGroups.length > 0 && (
          <div style={{ position: 'relative' }} ref={filterMenuRef}>
            <button
              style={{
                padding: '0.5rem',
                backgroundColor: selectedGroupId ? '#6366f1' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
              }}
              title={selectedGroupId ? 'Filtrare după grupă (activă)' : 'Filtrare după grupă'}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
            {showFilterMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.25rem',
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 1001,
                  minWidth: '200px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#666',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  Filtrare după grupă:
                </div>
                <button
                  onClick={() => handleGroupSelect(null)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: selectedGroupId === null ? '#f0f0ff' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#000',
                    borderBottom: '1px solid #eee',
                    fontWeight: selectedGroupId === null ? 'bold' : 'normal',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedGroupId !== null) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedGroupId !== null) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  Toate grupele
                </button>
                {availableGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group.id)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: selectedGroupId === group.id ? '#f0f0ff' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#000',
                      borderBottom: '1px solid #eee',
                      fontWeight: selectedGroupId === group.id ? 'bold' : 'normal',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedGroupId !== group.id) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedGroupId !== group.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {group.groupName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '500px',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          fontSize: '1.25rem',
          fontWeight: 'normal',
          color: 'gray',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {(() => {
          const yearLabel = academicYear === 1 ? 'I' : academicYear === 2 ? 'II' : academicYear === 3 ? 'III' : academicYear === 4 ? 'IV' : academicYear;
          const cycleLabel = cycleType === 'F' ? ' - Licență frecvență' : cycleType === 'FR' ? ' - Licență frecvență redusă' : cycleType === 'masterat' ? ' - Masterat' : '';
          
          if (period === 'semester1') {
            return `Orar semestrul de toamnă anul ${yearLabel}${cycleLabel}`;
          } else if (period === 'semester2') {
            return `Orar semestrul de primăvară anul ${yearLabel}${cycleLabel}`;
          } else if (period === 'assessments1') {
            return `Orar evaluarea periodică nr. 1 - Anul ${yearLabel}${cycleLabel}`;
          } else if (period === 'assessments2') {
            return `Orar evaluarea periodică nr. 2 - Anul ${yearLabel}${cycleLabel}`;
          } else if (period === 'exams') {
            return `Orar Sesiunea de examinare - Anul ${yearLabel}${cycleLabel}`;
          }
          // Fallback pentru cazul în care nu se știe tipul de orar
          return `Orar - Anul ${yearLabel}${cycleLabel}`;
        })()}
      </div>
    </div>
  );
}

