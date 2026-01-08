import React from 'react';
import type { CellData } from './ScheduleGrid.types';
import { getCellKey } from './ScheduleGrid.utils';

type AssessmentScheduleGridCellProps = {
  groupId: string;
  day: string;
  hour: string;
  cellData: CellData | undefined;
  onInputChange: (groupId: string, day: string, hour: string, field: keyof CellData, value: string) => void;
};

export default function AssessmentScheduleGridCell({
  groupId,
  day,
  hour,
  cellData,
  onInputChange,
}: AssessmentScheduleGridCellProps) {
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
    </div>
  );
}

