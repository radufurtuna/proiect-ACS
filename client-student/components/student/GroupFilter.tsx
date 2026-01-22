'use client';

import React, { useState, useEffect, useRef } from 'react';
import { buttonStyles, COLORS } from '@/utils/styles';

interface GroupFilterProps {
  groups: string[];
  selectedGroup: string;
  onGroupSelect: (groupCode: string) => void;
}

export default function GroupFilter({ groups, selectedGroup, onGroupSelect }: GroupFilterProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Închide meniul când se face click în afara lui
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

  return (
    <div ref={filterMenuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowFilterMenu(!showFilterMenu)}
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
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filtrare
        {selectedGroup !== 'all' && (
          <span
            style={{
              marginLeft: '0.25rem',
              backgroundColor: 'rgba(255,255,255,0.3)',
              padding: '0.125rem 0.375rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
            }}
          >
            {selectedGroup}
          </span>
        )}
      </button>
      {showFilterMenu && (
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
            minWidth: '200px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <button
            onClick={() => {
              onGroupSelect('all');
              setShowFilterMenu(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              textAlign: 'left',
              border: 'none',
              backgroundColor: selectedGroup === 'all' ? COLORS.primaryLight : 'transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: COLORS.textPrimary,
              borderBottom: `1px solid ${COLORS.borderLight}`,
              fontWeight: selectedGroup === 'all' ? '600' : '400',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => {
              if (selectedGroup !== 'all') {
                e.currentTarget.style.backgroundColor = COLORS.backgroundLight;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedGroup !== 'all') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Toate grupele
          </button>
          {groups.map((groupCode) => (
            <button
              key={groupCode}
              onClick={() => {
                onGroupSelect(groupCode);
                setShowFilterMenu(false);
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                textAlign: 'left',
                border: 'none',
                backgroundColor: selectedGroup === groupCode ? COLORS.primaryLight : 'transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: COLORS.textPrimary,
                borderBottom: `1px solid ${COLORS.borderLight}`,
                fontWeight: selectedGroup === groupCode ? '600' : '400',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                if (selectedGroup !== groupCode) {
                  e.currentTarget.style.backgroundColor = COLORS.backgroundLight;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedGroup !== groupCode) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {groupCode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

