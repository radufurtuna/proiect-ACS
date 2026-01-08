'use client';

/**
 * AssessmentScheduleTable - Component pentru logica tabelului cu orarul pentru evaluarea periodică
 * 
 * Acest component conține structura completă a tabelului de orar pentru admin:
 * - Header cu zilele, orele și coloanele pentru grupe (editabile)
 * - Body cu toate rândurile pentru fiecare zi și oră
 * - Celule editabile pentru fiecare grupă (folosind AssessmentScheduleGridCell)
 * 
 * Componentul primește toate datele și handlers-urile ca props,
 * permițând reutilizarea structurii tabelului în diferite contexte.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { DAYS,  type CellData, type GroupColumn } from './ScheduleGrid.types';
import { getCellKey } from './ScheduleGrid.utils';
import AssessmentScheduleGridCell from './AssessmentScheduleGridCell';
import type { AssessmentRow } from './AssessmentScheduleGrid';

// Funcție pentru ajustarea automată a înălțimii textarea-ului
const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
};

// Component pentru textarea cu ajustare automată a înălțimii
const AutoResizeTextarea = React.memo(({ 
  value, 
  onChange, 
  placeholder
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [onChange]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      rows={1}
      style={{
        width: '100%',
        padding: '0.25rem',
        border: '1px solid #ccc',
        borderRadius: '2px',
        fontSize: '0.75rem',
        color: '#000',
        backgroundColor: '#fff',
        textAlign: 'center',
        resize: 'none',
        fontFamily: 'inherit',
        overflow: 'hidden',
        minHeight: '25px',
      }}
    />
  );
});

interface AssessmentScheduleTableProps {
  groups: GroupColumn[];
  cellData: Record<string, Record<string, CellData>>;
  assessmentRows: AssessmentRow[];
  onGroupNameChange: (groupId: string, newName: string) => void;
  onInputChange: (groupId: string, day: string, hour: string, field: keyof CellData, value: string) => void;
  onRowChange: (rowId: string, field: keyof Omit<AssessmentRow, 'id' | 'groups' | 'professors' | 'dates' | 'times' | 'rooms'>, value: string) => void;
  onGroupInRowChange: (rowId: string, groupIndex: number, value: string) => void;
  onAddGroupToRow: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
  onProfessorInRowChange: (rowId: string, index: number, value: string) => void;
  onDateInRowChange: (rowId: string, index: number, value: string) => void;
  onTimeInRowChange: (rowId: string, index: number, value: string) => void;
  onRoomInRowChange: (rowId: string, index: number, value: string) => void;
}

export default function AssessmentScheduleTable({
  groups,
  cellData,
  assessmentRows,
  onGroupNameChange,
  onInputChange,
  onRowChange,
  onGroupInRowChange,
  onAddGroupToRow,
  onDeleteRow,
  onProfessorInRowChange,
  onDateInRowChange,
  onTimeInRowChange,
  onRoomInRowChange,
}: AssessmentScheduleTableProps) {
  return (
    <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
          border: '1px solid #000',
          tableLayout: 'fixed',
          width: 'auto',
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
                width: '250px',
                minWidth: '250px',
                maxWidth: '250px',
              }}
            >
              Disciplina
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
                  width: '200px',
                  minWidth: '200px',
                  maxWidth: '200px',
                }}
              >
                {group.groupName || 'Nume grupă'}
              </th>
            ))}
            <th
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
              Componenţa seriei (grupele)
            </th>
            <th
              style={{
                border: '1px solid #000',
                padding: '0.5rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '200px',
                minWidth: '200px',
                maxWidth: '200px',
              }}
            >
              Cadrul didactic titular
            </th>
            <th
              style={{
                border: '1px solid #000',
                padding: '0.5rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '100px',
                minWidth: '100px',
                maxWidth: '100px',
              }}
            >
              Data
            </th>
            <th
              style={{
                border: '1px solid #000',
                padding: '0.5rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '80px',
                minWidth: '80px',
                maxWidth: '80px',
              }}
            >
              Ora
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
              Sala
            </th>
          </tr>
        </thead>
        <tbody>
          {assessmentRows.map((row) => {
            const maxGroups = Math.max(
              row.groups.length,
              row.professors.length,
              row.dates.length,
              row.times.length,
              row.rooms.length
            );
            
            return (
              <React.Fragment key={row.id}>
                {maxGroups === 0 ? (
                  <tr key={`${row.id}-empty`}>
                    {/* Disciplina */}
                    <td
                      rowSpan={1}
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        textAlign: 'center',
                        color: '#000',
                        verticalAlign: 'top',
                      }}
                    >
                      <AutoResizeTextarea
                        value={row.subject}
                        onChange={(e) => onRowChange(row.id, 'subject', e.target.value)}
                      />
                    </td>
                    {/* Coloane pentru grupe */}
                    {groups.map((group) => (
                      <td
                        key={group.id}
                        style={{
                          border: '1px solid #000',
                          padding: '0.5rem',
                          textAlign: 'center',
                          color: '#000',
                          verticalAlign: 'top',
                        }}
                      >
                        <input
                          type="text"
                          style={{
                            width: '100%',
                            padding: '0.25rem',
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                            fontSize: '0.75rem',
                            color: '#000',
                            backgroundColor: '#fff',
                            textAlign: 'center',
                          }}
                        />
                      </td>
                    ))}
                    {/* Componenţa seriei (grupele) */}
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        textAlign: 'center',
                        color: '#000',
                        verticalAlign: 'top',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onAddGroupToRow(row.id)}
                        style={{
                          padding: '0.125rem 0.25rem',
                          fontSize: '0.65rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        + Adaugă grupă
                      </button>
                    </td>
                    {/* Cadrul didactic titular */}
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        textAlign: 'center',
                        color: '#000',
                        verticalAlign: 'top',
                      }}
                    ></td>
                    {/* Data */}
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        textAlign: 'center',
                        color: '#000',
                        verticalAlign: 'top',
                      }}
                    ></td>
                    {/* Ora */}
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        textAlign: 'center',
                        color: '#000',
                        verticalAlign: 'top',
                      }}
                    ></td>
                    {/* Sala */}
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        textAlign: 'center',
                        color: '#000',
                        verticalAlign: 'top',
                      }}
                    ></td>
                  </tr>
                ) : (
                  row.groups.map((groupName, groupIndex) => (
                    <tr key={`${row.id}-${groupIndex}`}>
                      {groupIndex === 0 && (
                        <>
                          {/* Disciplina */}
                          <td
                            rowSpan={maxGroups}
                            style={{
                              border: '1px solid #000',
                              padding: '0.5rem',
                              textAlign: 'center',
                              color: '#000',
                              verticalAlign: 'top',
                            }}
                          >
                            <AutoResizeTextarea
                              value={row.subject}
                              onChange={(e) => onRowChange(row.id, 'subject', e.target.value)}
                            />
                          </td>
                          {/* Coloane pentru grupe */}
                          {groups.map((group) => (
                            <td
                              key={group.id}
                              rowSpan={maxGroups}
                              style={{
                                border: '1px solid #000',
                                padding: '0.5rem',
                                textAlign: 'center',
                                color: '#000',
                                verticalAlign: 'top',
                              }}
                            >
                              <input
                                type="text"
                                style={{
                                  width: '100%',
                                  padding: '0.25rem',
                                  border: '1px solid #ccc',
                                  borderRadius: '2px',
                                  fontSize: '0.75rem',
                                  color: '#000',
                                  backgroundColor: '#fff',
                                  textAlign: 'center',
                                }}
                              />
                            </td>
                          ))}
                        </>
                      )}
                      {/* Componenţa seriei (grupele) */}
                      <td
                        style={{
                          border: '1px solid #000',
                          padding: '0.5rem',
                          textAlign: 'center',
                          color: '#000',
                          verticalAlign: 'top',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%' }}>
                          <span style={{ 
                            fontSize: '1rem', 
                            fontWeight: 'normal', 
                            color: '#000',
                            minWidth: '25px',
                            textAlign: 'center',
                            paddingTop: '0.25rem',
                          }}>
                            {groupIndex + 1}.
                          </span>
                          <div style={{ flex: 1 }}>
                            <AutoResizeTextarea
                              value={groupName}
                              onChange={(e) => onGroupInRowChange(row.id, groupIndex, e.target.value)}
                              placeholder="Nume grupă"
                            />
                          </div>
                        </div>
                        {groupIndex === maxGroups - 1 && (
                          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <button
                              type="button"
                              onClick={() => onAddGroupToRow(row.id)}
                              style={{
                                padding: '0.125rem 0.25rem',
                                fontSize: '0.65rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                flex: 1,
                              }}
                            >
                              + Adaugă grupă
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRow(row.id)}
                              style={{
                                padding: '0.125rem 0.25rem',
                                fontSize: '0.65rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                flex: 1,
                              }}
                            >
                              Șterge rând
                            </button>
                          </div>
                        )}
                      </td>
                      {/* Cadrul didactic titular */}
                      <td
                        style={{
                          border: '1px solid #000',
                          padding: '0.5rem',
                          textAlign: 'center',
                          color: '#000',
                          verticalAlign: 'top',
                        }}
                      >
                        <input
                          type="text"
                          value={row.professors[groupIndex] || ''}
                          onChange={(e) => onProfessorInRowChange(row.id, groupIndex, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.25rem',
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                            fontSize: '0.75rem',
                            color: '#000',
                            backgroundColor: '#fff',
                            textAlign: 'center',
                          }}
                        />
                      </td>
                      {/* Data */}
                      <td
                        style={{
                          border: '1px solid #000',
                          padding: '0.5rem',
                          textAlign: 'center',
                          color: '#000',
                          verticalAlign: 'top',
                        }}
                      >
                        <input
                          type="text"
                          value={row.dates[groupIndex] || ''}
                          onChange={(e) => onDateInRowChange(row.id, groupIndex, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.25rem',
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                            fontSize: '0.75rem',
                            color: '#000',
                            backgroundColor: '#fff',
                            textAlign: 'center',
                          }}
                        />
                      </td>
                      {/* Ora */}
                      <td
                        style={{
                          border: '1px solid #000',
                          padding: '0.5rem',
                          textAlign: 'center',
                          color: '#000',
                          verticalAlign: 'top',
                        }}
                      >
                        <input
                          type="text"
                          value={row.times[groupIndex] || ''}
                          onChange={(e) => onTimeInRowChange(row.id, groupIndex, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.25rem',
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                            fontSize: '0.75rem',
                            color: '#000',
                            backgroundColor: '#fff',
                            textAlign: 'center',
                          }}
                        />
                      </td>
                      {/* Sala */}
                      <td
                        style={{
                          border: '1px solid #000',
                          padding: '0.5rem',
                          textAlign: 'center',
                          color: '#000',
                          verticalAlign: 'top',
                        }}
                      >
                        <input
                          type="text"
                          value={row.rooms[groupIndex] || ''}
                          onChange={(e) => onRoomInRowChange(row.id, groupIndex, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.25rem',
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                            fontSize: '0.75rem',
                            color: '#000',
                            backgroundColor: '#fff',
                            textAlign: 'center',
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

