'use client';

import React from 'react';

interface CycleMasteratButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function CycleMasteratButton({ isOpen, onToggle }: CycleMasteratButtonProps) {
  return (
    <>
      <tr>
        <td
          style={{
            border: '1px solid #ddd',
            padding: '1rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isOpen ? '#f0f0f0' : 'white',
            transition: 'background-color 0.2s ease',
            color: '#000',
          }}
          onClick={onToggle}
          onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = '#f9f9f9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          Ciclul 2 masterat
        </td>
      </tr>
      {/* Conținut expandat */}
      {isOpen && (
        <tr>
          <td
            style={{
              border: '1px solid #ddd',
              borderTop: 'none',
              padding: '1rem',
              backgroundColor: '#fafafa',
            }}
          >
            {/* Aici va apărea tabelul de butoane pentru nivelul 2 */}
            <p style={{ color: '#666', textAlign: 'center', margin: 0 }}>
              Tabelul de butoane pentru nivelul 2 va apărea aici
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
