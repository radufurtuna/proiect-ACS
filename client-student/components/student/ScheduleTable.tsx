'use client';

import React, { Fragment } from 'react';
import type { Schedule } from '@/types/schedule';

interface ScheduleTableProps {
  schedules: Schedule[];
  selectedGroup: string;
  uniqueGroups: string[];
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
}: ScheduleTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: 'auto',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: '1px solid #000',
                padding: '0.5rem',
                textAlign: 'center',
                fontWeight: 'bold',
                backgroundColor: '#f0f0f0',
                color: '#000',
                width: '80px',
                minWidth: '80px',
                maxWidth: '80px',
              }}
            >
              Zilele
            </th>
            <th
              style={{
                border: '1px solid #000',
                padding: '0.5rem',
                textAlign: 'center',
                fontWeight: 'bold',
                backgroundColor: '#f0f0f0',
                color: '#000',
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
                  border: '1px solid #000',
                  padding: '0.5rem',
                  backgroundColor: '#f0f0f0',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#000',
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
          {DAYS.map((day) => (
            <Fragment key={day}>
              {TIME_SLOTS.map((hour, index) => (
                <tr key={`${day}-${hour}`}>
                  {index === 0 && (
                    <td
                      rowSpan={7}
                      style={{
                        border: '1px solid #000',
                        padding: '0.5rem',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        verticalAlign: 'top',
                        color: '#000',
                        width: '80px',
                        minWidth: '80px',
                        maxWidth: '80px',
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
                      width: '100px',
                      minWidth: '100px',
                      maxWidth: '100px',
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
                          border: '1px solid #000',
                          padding: '0.5rem',
                          width: YEAR_COLUMN_WIDTH,
                          minWidth: '150px',
                          maxWidth: '150px',
                          color: '#000',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                        }}
                      >
                        {schedule ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {/* Date normale */}
                            <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                              {schedule.subject.name}
                            </div>
                            <div style={{ fontSize: '0.75rem' }}>
                              {schedule.professor.full_name}
                            </div>
                            <div style={{ fontSize: '0.75rem' }}>
                              {schedule.room.code}
                            </div>
                            
                            {/* Date pentru săptămâna impară (dacă există) */}
                            {schedule.odd_week_subject && schedule.odd_week_professor && schedule.odd_week_room && (
                              <div
                                style={{
                                  marginTop: '0.5rem',
                                  padding: '0.5rem',
                                  backgroundColor: '#e0e0e0',
                                  borderRadius: '3px',
                                  borderTop: '1px dashed #999',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.7rem',
                                    color: '#666',
                                    fontWeight: '500',
                                    marginBottom: '0.25rem',
                                  }}
                                >
                                  Săpt. Impară:
                                </div>
                                <div style={{ fontSize: '0.7rem', fontWeight: '500', color: '#333' }}>
                                  {schedule.odd_week_subject.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#333' }}>
                                  {schedule.odd_week_professor.full_name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#333' }}>
                                  {schedule.odd_week_room.code}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#999' }}>—</div>
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

