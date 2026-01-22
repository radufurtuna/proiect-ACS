'use client';

/**
 * ScheduleTable - Component pentru logica tabelului cu orarul
 * 
 * Acest component conține structura completă a tabelului de orar pentru admin:
 * - Header cu zilele, orele și coloanele pentru grupe (editabile)
 * - Body cu toate rândurile pentru fiecare zi și oră
 * - Celule editabile pentru fiecare grupă (folosind ScheduleGridCell)
 * - Suport pentru săptămâna impară
 * 
 * Componentul primește toate datele și handlers-urile ca props,
 * permițând reutilizarea structurii tabelului în diferite contexte.
 */

import React from 'react';
import { DAYS, TIME_SLOTS, type CellData, type GroupColumn } from './ScheduleGrid.types';
import { getCellKey } from './ScheduleGrid.utils';
import ScheduleGridCell from './ScheduleGridCell';
import GroupAutocomplete from './GroupAutocomplete';

interface ScheduleTableProps {
  groups: GroupColumn[];
  cellData: Record<string, Record<string, CellData>>;
  oddWeekInputsOpen: Record<string, boolean>;
  onGroupNameChange: (groupId: string, newName: string) => void;
  onInputChange: (groupId: string, day: string, hour: string, field: keyof CellData, value: string) => void;
  onOddWeekInputChange: (groupId: string, day: string, hour: string, field: 'subject' | 'professor' | 'room', value: string) => void;
  onToggleOddWeek: (groupId: string, day: string, hour: string) => void;
}

export default function ScheduleTable({
  groups,
  cellData,
  oddWeekInputsOpen,
  onGroupNameChange,
  onInputChange,
  onOddWeekInputChange,
  onToggleOddWeek,
}: ScheduleTableProps) {
  // Calculează lățimea totală a tabelului bazată pe coloane
  const totalWidth = 90 + 90 + (groups.length * 300); // 90px Zilele + 90px Orele + 300px per grupă

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
          border: '1px solid #000',
          tableLayout: 'fixed',
          width: `${totalWidth}px`,
          minWidth: `${totalWidth}px`,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: '1px solid #000',
                padding: '0.5rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '90px',
                minWidth: '90px',
                maxWidth: '90px',
              }}
            >
              Zilele
            </th>
            <th
              style={{
                border: '1px solid #000',
                padding: '0.5rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '90px',
                minWidth: '90px',
                maxWidth: '90px',
              }}
            >
              Orele
            </th>
            {groups.map((group) => (
              <th
                key={group.id}
                style={{
                  border: '1px solid #000',
                  padding: '0.5rem',
                  backgroundColor: '#f0f0f0',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#000',
                  width: '300px',
                  minWidth: '300px',
                  maxWidth: '300px',
                }}
              >
                <GroupAutocomplete
                  value={group.groupName}
                  onChange={(newValue) => onGroupNameChange(group.id, newValue)}
                  placeholder="Nume grupă"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <React.Fragment key={day}>
              {TIME_SLOTS.map((hour, index) => (
                <tr key={`${day}-${hour}`}>
                  {index === 0 && (
                    <td
                      rowSpan={TIME_SLOTS.length}
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        verticalAlign: 'top',
                        color: '#000',
                        width: '90px',
                        minWidth: '90px',
                        maxWidth: '90px',
                      }}
                    >
                      {day}
                    </td>
                  )}
                  <td
                    style={{
                      border: '1px solid #000',
                      padding: '0.5rem',
                      textAlign: 'center',
                      color: '#000',
                      width: '90px',
                      minWidth: '90px',
                      maxWidth: '90px',
                    }}
                  >
                    {hour}
                  </td>
                  {groups.map((group) => (
                    <td
                      key={group.id}
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        width: '300px',
                        minWidth: '300px',
                        maxWidth: '300px',
                        color: '#000',
                        verticalAlign: 'top',
                        overflow: 'hidden',
                      }}
                    >
                      <ScheduleGridCell
                        groupId={group.id}
                        day={day}
                        hour={hour}
                        cellData={cellData[group.id]?.[getCellKey(day, hour)]}
                        oddWeekInputsOpen={oddWeekInputsOpen[`${group.id}-${getCellKey(day, hour)}`] || false}
                        onInputChange={onInputChange}
                        onOddWeekInputChange={onOddWeekInputChange}
                        onToggleOddWeek={onToggleOddWeek}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

