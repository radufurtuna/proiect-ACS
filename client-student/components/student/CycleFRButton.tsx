'use client';

import React from 'react';

// Constante pentru lățimi
const FIRST_COLUMN_WIDTH = '250px';
const YEAR_COLUMN_WIDTH = '90px';

interface CycleFRButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  onScheduleSelect?: (year: number, period: string, cellNumber: number) => void;
}

export default function CycleFRButton({ isOpen, onToggle, onScheduleSelect }: CycleFRButtonProps) {
  // Funcție helper pentru a crea butonul pentru un an
  const createYearButton = (year: number, cellNumber: number, periodKey: string) => {
    const yearLabel = year === 1 ? 'I' : year === 2 ? 'II' : year === 3 ? 'III' : 'IV';
    return (
      <td
        key={`${year}-${cellNumber}`}
        style={{
          border: '1px solid #ddd',
          padding: '0',
          backgroundColor: 'white',
          width: YEAR_COLUMN_WIDTH,
          position: 'relative',
        }}
      >
        <button
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            padding: '1rem',
            backgroundColor: 'white',
            color: '#000',
            cursor: 'pointer',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
          onClick={() => onScheduleSelect?.(year, periodKey, cellNumber)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          Anul {yearLabel}
        </button>
        <span style={{ fontSize: '10px', color: '#ccc', position: 'absolute', top: '2px', left: '2px' }}>
          {cellNumber}
        </span>
      </td>
    );
  };

  // Funcție helper pentru a crea celula cu text perioadă
  const createPeriodCell = (periodText: string) => (
    <td
      style={{
        border: '1px solid #ddd',
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        color: '#000',
        width: FIRST_COLUMN_WIDTH,
      }}
    >
      {periodText}
    </td>
  );

  // Perioadele și numerele celulelor pentru fiecare an (începând de la 21)
  const periods = [
    { text: 'Orar Semestrul de toamnă', cellNumbers: [21, 22, 23, 24], periodKey: 'semester1' },
    { text: 'Orar evaluarea periodică nr. 1', cellNumbers: [25, 26, 27, 28], periodKey: 'assessments1' },
    { text: 'Orar evaluarea periodică nr. 2', cellNumbers: [29, 30, 31, 32], periodKey: 'assessments2' },
    { text: 'Orar Sesiunea de examinare', cellNumbers: [33, 34, 35, 36], periodKey: 'exams' },
    { text: 'Orar Semestrul de primavara', cellNumbers: [37, 38, 39, 40], periodKey: 'semester2' },
  ];

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
          Ciclul 1 Licență - frecventa redusa
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
              textAlign: 'center',
            }}
          >
            <table
              style={{
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                margin: '0 auto',
              }}
            >
              <tbody>
                {/* Linia cu celula goală și cei 4 ani */}
                <tr>
                  {/* Celulă goală */}
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '1rem',
                      backgroundColor: '#e3f2fd',
                      width: FIRST_COLUMN_WIDTH,
                    }}
                  />
                  {/* Anii */}
                  {[1, 2, 3, 4].map((year) => (
                    <td
                      key={year}
                      style={{
                        border: '1px solid #ddd',
                        padding: '1rem',
                        textAlign: 'center',
                        backgroundColor: '#e3f2fd',
                        color: '#000',
                        width: YEAR_COLUMN_WIDTH,
                      }}
                    >
                      Anul {year === 1 ? 'I' : year === 2 ? 'II' : year === 3 ? 'III' : 'IV'}
                    </td>
                  ))}
                </tr>
                {/* Liniile cu perioade */}
                {periods.map((period) => (
                  <tr key={period.periodKey}>
                    {createPeriodCell(period.text)}
                    {[1, 2, 3, 4].map((year, index) =>
                      createYearButton(year, period.cellNumbers[index], period.periodKey)
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
