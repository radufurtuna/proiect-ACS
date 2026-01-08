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

import React from 'react';
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
}: ScheduleTableActionsProps) {
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
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '1.25rem',
          fontWeight: 'normal',
          color: 'gray',
          textAlign: 'center',
        }}
      >
        Orar semestrul de toamnă anul{' '}
        {academicYear === 1 ? 'I' : academicYear === 2 ? 'II' : academicYear === 3 ? 'III' : academicYear === 4 ? 'IV' : academicYear}
      </div>
    </div>
  );
}

