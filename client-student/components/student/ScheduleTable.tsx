'use client';

import React, { Fragment } from 'react';
import type { Schedule } from '@/types/schedule';
import { tableStyles, COLORS, cardStyles } from '@/utils/styles';

interface ScheduleTableProps {
  schedules: Schedule[];
  selectedGroup: string;
  uniqueGroups: string[];
  // Opțional: filtrează tabelul doar pe o anumită zi (ex: "Luni").
  // Dacă este "all" sau undefined, afișează toate zilele.
  dayFilter?: string | 'all';
}

const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'] as const;
const TIME_SLOTS = [
  '8.00-9.30',
  '9.45-11.15',
  '11.30-13.00',
  '13.30-15.00',
  '15.15-16.45',
  '17.00-18.30',
  '18.45-20.15',
] as const;

const YEAR_COLUMN_WIDTH = '90px';

export default function ScheduleTable({
  schedules,
  selectedGroup,
  uniqueGroups,
  dayFilter,
}: ScheduleTableProps) {
  const daysToRender = (dayFilter && dayFilter !== 'all')
    ? DAYS.filter((d) => d === dayFilter)
    : DAYS;

  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', overflow: 'hidden', boxShadow: COLORS.shadow }}>
      <table
        style={{
          ...tableStyles.table,
          width: 'auto',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...tableStyles.th,
                border: `2px solid ${COLORS.borderDark}`,
                borderRight: `2px solid ${COLORS.borderDark}`,
                padding: '1rem 0.75rem',
                textAlign: 'center',
                width: '80px',
                minWidth: '80px',
                maxWidth: '80px',
              }}
            >
              Zilele
            </th>
            <th
              style={{
                ...tableStyles.th,
                border: `2px solid ${COLORS.borderDark}`,
                borderRight: `2px solid ${COLORS.borderDark}`,
                padding: '1rem 0.75rem',
                textAlign: 'center',
                width: '125px',
                minWidth: '125px',
                maxWidth: '125px',
              }}
            >
              Orele
            </th>
            {(selectedGroup === 'all' ? uniqueGroups : [selectedGroup]).map((groupCode) => (
              <th
                key={groupCode}
                style={{
                  ...tableStyles.th,
                  border: `2px solid ${COLORS.borderDark}`,
                  borderRight: `2px solid ${COLORS.borderDark}`,
                  padding: '1rem 0.75rem',
                  textAlign: 'center',
                  width: '150px',
                  minWidth: '150px',
                  maxWidth: '150px',
                }}
              >
                {groupCode}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {daysToRender.map((day) => (
            <Fragment key={day}>
              {TIME_SLOTS.map((hour, index) => (
                <tr key={`${day}-${hour}`}>
                  {index === 0 && (
                    <td
                      rowSpan={7}
                      style={{
                        ...tableStyles.td,
                        border: `2px solid ${COLORS.borderDark}`,
                        borderRight: `2px solid ${COLORS.borderDark}`,
                        padding: '1rem 0.75rem',
                        textAlign: 'center',
                        fontWeight: '700',
                        verticalAlign: 'top',
                        width: '80px',
                        minWidth: '80px',
                        maxWidth: '80px',
                        backgroundColor: COLORS.backgroundLight,
                      }}
                    >
                      {day}
                    </td>
                  )}
                  <td
                    style={{
                      ...tableStyles.td,
                      border: `2px solid ${COLORS.borderDark}`,
                      borderRight: `2px solid ${COLORS.borderDark}`,
                      padding: '0.75rem',
                      textAlign: 'center',
                      width: '100px',
                      minWidth: '100px',
                      maxWidth: '100px',
                      backgroundColor: COLORS.backgroundLight,
                    }}
                  >
                    {hour}
                  </td>
                  {(selectedGroup === 'all' ? uniqueGroups : [selectedGroup]).map((groupCode) => {
                    const schedule = schedules.find(
                      (s) => s.group.code === groupCode && s.day === day && s.hour === hour
                    );
                    return (
                      <td
                        key={groupCode}
                        style={{
                          ...tableStyles.td,
                          border: `2px solid ${COLORS.borderDark}`,
                          borderRight: `2px solid ${COLORS.borderDark}`,
                          padding: '0.75rem',
                          width: YEAR_COLUMN_WIDTH,
                          minWidth: '150px',
                          maxWidth: '150px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          backgroundColor: COLORS.white,
                        }}
                      >
                        {schedule ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            {/* Date normale */}
                            <div style={{ 
                              fontSize: '0.8125rem', 
                              fontWeight: '600',
                              color: COLORS.textPrimary,
                              lineHeight: '1.4',
                            }}>
                              {schedule.subject.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem',
                              color: COLORS.textSecondary,
                              lineHeight: '1.3',
                            }}>
                              {schedule.professor.full_name}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem',
                              color: COLORS.primary,
                              fontWeight: '500',
                            }}>
                              {schedule.room.code}
                            </div>
                            
                            {/* Date pentru săptămâna impară (dacă există) */}
                            {schedule.odd_week_subject && schedule.odd_week_professor && schedule.odd_week_room && (
                              <div
                                style={{
                                  marginTop: '0.5rem',
                                  padding: '0.625rem',
                                  backgroundColor: COLORS.backgroundLight,
                                  borderRadius: '6px',
                                  borderTop: `2px dashed ${COLORS.border}`,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6875rem',
                                    color: COLORS.textMuted,
                                    fontWeight: '600',
                                    marginBottom: '0.375rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Săpt. Impară:
                                </div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  fontWeight: '600', 
                                  color: COLORS.textPrimary,
                                  marginBottom: '0.25rem',
                                }}>
                                  {schedule.odd_week_subject.name}
                                </div>
                                <div style={{ 
                                  fontSize: '0.6875rem', 
                                  color: COLORS.textSecondary,
                                  marginBottom: '0.125rem',
                                }}>
                                  {schedule.odd_week_professor.full_name}
                                </div>
                                <div style={{ 
                                  fontSize: '0.6875rem', 
                                  color: COLORS.primary,
                                  fontWeight: '500',
                                }}>
                                  {schedule.odd_week_room.code}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ 
                            fontSize: '0.8125rem', 
                            color: COLORS.textLight,
                            fontStyle: 'italic',
                          }}>—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

