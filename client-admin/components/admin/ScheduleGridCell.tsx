import React from 'react';
import type { CellData } from './ScheduleGrid.types';
import { getCellKey } from './ScheduleGrid.utils';

type ScheduleGridCellProps = {
  groupId: string;
  day: string;
  hour: string;
  cellData: CellData | undefined;
  oddWeekInputsOpen: boolean;
  onInputChange: (groupId: string, day: string, hour: string, field: keyof CellData, value: string) => void;
  onOddWeekInputChange: (groupId: string, day: string, hour: string, field: 'subject' | 'professor' | 'room', value: string) => void;
  onToggleOddWeek: (groupId: string, day: string, hour: string) => void;
};

export default function ScheduleGridCell({
  groupId,
  day,
  hour,
  cellData,
  oddWeekInputsOpen,
  onInputChange,
  onOddWeekInputChange,
  onToggleOddWeek,
}: ScheduleGridCellProps) {
  const cellKey = getCellKey(day, hour);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.25rem',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <input
        type="text"
        placeholder="Disciplină"
        value={cellData?.subject || ''}
        onChange={(e) => onInputChange(groupId, day, hour, 'subject', e.target.value)}
        style={{
          width: '100%',
          padding: '0.25rem',
          border: '1px solid #ccc',
          borderRadius: '2px',
          fontSize: '0.75rem',
          color: '#000',
          backgroundColor: '#fff',
        }}
      />
      <input
        type="text"
        placeholder="Profesor"
        value={cellData?.professor || ''}
        onChange={(e) => onInputChange(groupId, day, hour, 'professor', e.target.value)}
        style={{
          width: '100%',
          padding: '0.25rem',
          border: '1px solid #ccc',
          borderRadius: '2px',
          fontSize: '0.75rem',
          color: '#000',
          backgroundColor: '#fff',
        }}
      />
      <input
        type="text"
        placeholder="Sală"
        value={cellData?.room || ''}
        onChange={(e) => onInputChange(groupId, day, hour, 'room', e.target.value)}
        style={{
          width: '100%',
          padding: '0.25rem',
          border: '1px solid #ccc',
          borderRadius: '2px',
          fontSize: '0.75rem',
          color: '#000',
          backgroundColor: '#fff',
        }}
      />
      {/* Buton pentru orarul săptămânii impare */}
      <button
        type="button"
        onClick={() => onToggleOddWeek(groupId, day, hour)}
        style={{
          marginTop: '0.25rem',
          padding: '0.125rem 0.25rem',
          fontSize: '0.65rem',
          backgroundColor: oddWeekInputsOpen ? '#b6d7a8' : '#999999',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          width: '100%',
        }}
        title={oddWeekInputsOpen ? 'Ascunde orarul săptămânii impare' : 'Afișează orarul săptămânii impare'}
      >
        {oddWeekInputsOpen ? '▲ Săpt. Impară' : '▼ Săpt. Impară'}
      </button>
      {/* Input-uri pentru săptămâna impară (afișate doar dacă butonul este activat) */}
      {oddWeekInputsOpen && (
        <>
          <div style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed #ccc' }}>
            <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', fontWeight: 'bold' }}>
              Săpt. Impară:
            </div>
            <input
              type="text"
              placeholder="Disciplină (Impar)"
              value={cellData?.oddWeek?.subject || ''}
              onChange={(e) => onOddWeekInputChange(groupId, day, hour, 'subject', e.target.value)}
              style={{
                width: '100%',
                padding: '0.25rem',
                border: '1px solid #999',
                borderRadius: '2px',
                fontSize: '0.75rem',
                color: '#000',
                backgroundColor: '#fff',
                marginBottom: '0.25rem',
              }}
            />
            <input
              type="text"
              placeholder="Profesor (Impar)"
              value={cellData?.oddWeek?.professor || ''}
              onChange={(e) => onOddWeekInputChange(groupId, day, hour, 'professor', e.target.value)}
              style={{
                width: '100%',
                padding: '0.25rem',
                border: '1px solid #999',
                borderRadius: '2px',
                fontSize: '0.75rem',
                color: '#000',
                backgroundColor: '#fff',
                marginBottom: '0.25rem',
              }}
            />
            <input
              type="text"
              placeholder="Sală (Impar)"
              value={cellData?.oddWeek?.room || ''}
              onChange={(e) => onOddWeekInputChange(groupId, day, hour, 'room', e.target.value)}
              style={{
                width: '100%',
                padding: '0.25rem',
                border: '1px solid #999',
                borderRadius: '2px',
                fontSize: '0.75rem',
                color: '#000',
                backgroundColor: '#fff',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
