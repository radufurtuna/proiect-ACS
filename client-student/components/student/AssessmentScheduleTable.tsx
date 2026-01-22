'use client';

import React from 'react';
import { COLORS, tableStyles } from '@/utils/styles';
import type { AssessmentSchedule } from '@/types/schedule';

interface AssessmentScheduleTableProps {
  assessmentSchedules: AssessmentSchedule[];
  selectedGroup: string;
}

export default function AssessmentScheduleTable({
  assessmentSchedules,
  selectedGroup,
}: AssessmentScheduleTableProps) {
  // Extrage toate grupele unice din assessmentSchedules
  const allGroups = new Set<string>();
  assessmentSchedules.forEach((assessment) => {
    const groups = assessment.groups_composition
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);
    groups.forEach((group) => allGroups.add(group));
  });

  const uniqueGroups = Array.from(allGroups).sort();

  // Filtrează assessment-urile după grup dacă este selectat un grup specific
  const filteredAssessments =
    selectedGroup === 'all'
      ? assessmentSchedules
      : assessmentSchedules.filter((assessment) => {
          const groups = assessment.groups_composition
            .split(',')
            .map((g) => g.trim())
            .filter((g) => g.length > 0);
          return groups.includes(selectedGroup);
        });

  // Sortăm mai întâi toate assessment-urile după disciplină (ca în backend - order_by subject)
  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    return a.subject.localeCompare(b.subject);
  });

  // Grupează assessment-urile după disciplină (după sortare)
  const assessmentsBySubject = new Map<string, AssessmentSchedule[]>();
  sortedAssessments.forEach((assessment) => {
    const subject = assessment.subject;
    if (!assessmentsBySubject.has(subject)) {
      assessmentsBySubject.set(subject, []);
    }
    assessmentsBySubject.get(subject)!.push(assessment);
  });

  // Sortează assessment-urile din fiecare disciplină după dată și oră
  assessmentsBySubject.forEach((assessments) => {
    assessments.sort((a, b) => {
      const dateComparison = a.assessment_date.localeCompare(b.assessment_date);
      if (dateComparison !== 0) return dateComparison;
      return a.assessment_time.localeCompare(b.assessment_time);
    });
  });

  if (filteredAssessments.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '2rem',
          color: COLORS.textSecondary,
          backgroundColor: COLORS.white,
          borderRadius: '12px',
          border: `1px dashed ${COLORS.border}`,
          boxShadow: COLORS.shadowSm,
        }}
      >
        Nu există evaluări periodice pentru grupul selectat.
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: COLORS.shadow,
      }}
    >
      <table
        style={{
          ...tableStyles.table,
          width: '100%',
          fontSize: '0.875rem',
          borderCollapse: 'separate',
          borderSpacing: 0,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...tableStyles.th,
                border: `2px solid ${COLORS.borderDark}`,
                padding: '1rem 0.75rem',
                backgroundColor: COLORS.backgroundLight,
                textAlign: 'left',
                width: '260px',
              }}
            >
              Disciplina
            </th>
            <th
              style={{
                ...tableStyles.th,
                border: `2px solid ${COLORS.borderDark}`,
                padding: '1rem 0.75rem',
                backgroundColor: COLORS.backgroundLight,
                textAlign: 'left',
                width: '320px',
              }}
            >
              Componența seriei (grupele)
            </th>
            <th
              style={{
                ...tableStyles.th,
                border: `2px solid ${COLORS.borderDark}`,
                padding: '1rem 0.75rem',
                backgroundColor: COLORS.backgroundLight,
                textAlign: 'left',
                width: '220px',
              }}
            >
              Cadrul didactic titular
            </th>
            <th
              style={{
                ...tableStyles.th,
                border: `2px solid ${COLORS.borderDark}`,
                padding: '1rem 0.75rem',
                backgroundColor: COLORS.backgroundLight,
                textAlign: 'center',
                width: '120px',
              }}
            >
              Data
            </th>
            <th
              style={{
                ...tableStyles.th,
                border: `2px solid ${COLORS.borderDark}`,
                padding: '1rem 0.75rem',
                backgroundColor: COLORS.backgroundLight,
                textAlign: 'center',
                width: '110px',
              }}
            >
              Ora
            </th>
            <th
              style={{
                ...tableStyles.th,
                border: `2px solid ${COLORS.borderDark}`,
                padding: '1rem 0.75rem',
                backgroundColor: COLORS.backgroundLight,
                textAlign: 'center',
                width: '100px',
              }}
            >
              Sala
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from(assessmentsBySubject.entries()).map(([subject, assessments]) => (
            <React.Fragment key={subject}>
              {assessments.map((assessment, index) => (
                <tr key={assessment.id}>
                  {index === 0 && (
                    <td
                      rowSpan={assessments.length}
                      style={{
                        ...tableStyles.td,
                        border: `2px solid ${COLORS.borderDark}`,
                        padding: '0.9rem 0.75rem',
                        textAlign: 'left',
                        color: COLORS.textPrimary,
                        verticalAlign: 'middle',
                        fontWeight: 600,
                        background: 'linear-gradient(to bottom, #f9fafb, #eef2ff)',
                      }}
                    >
                      {subject}
                    </td>
                  )}
                   <td
                     style={{
                       ...tableStyles.td,
                       border: `2px solid ${COLORS.borderDark}`,
                       padding: '0.75rem',
                       textAlign: 'left',
                       color: COLORS.textPrimary,
                     }}
                   >
                     <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', width: '100%' }}>
                       <span
                         style={{
                           fontSize: '0.85rem',
                           fontWeight: 600,
                           color: COLORS.textSecondary,
                           minWidth: '28px',
                           height: '28px',
                           borderRadius: '999px',
                           border: `1px solid ${COLORS.border}`,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           flexShrink: 0,
                         }}
                       >
                         {index + 1}.
                       </span>
                       <span style={{ flex: 1, textAlign: 'left', fontSize: '0.875rem' }}>
                         {selectedGroup === 'all'
                           ? assessment.groups_composition
                           : assessment.groups_composition
                               .split(',')
                               .map((g) => g.trim())
                               .filter((g) => g === selectedGroup)
                               .join(', ')}
                       </span>
                     </div>
                   </td>
                  <td
                    style={{
                      ...tableStyles.td,
                      border: `2px solid ${COLORS.borderDark}`,
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: COLORS.textPrimary,
                    }}
                  >
                    {assessment.professor_name}
                  </td>
                  <td
                    style={{
                      ...tableStyles.td,
                      border: `2px solid ${COLORS.borderDark}`,
                      padding: '0.75rem',
                      textAlign: 'center',
                      color: COLORS.textPrimary,
                    }}
                  >
                    {assessment.assessment_date}
                  </td>
                  <td
                    style={{
                      ...tableStyles.td,
                      border: `2px solid ${COLORS.borderDark}`,
                      padding: '0.75rem',
                      textAlign: 'center',
                      color: COLORS.textPrimary,
                    }}
                  >
                    {assessment.assessment_time}
                  </td>
                  <td
                    style={{
                      ...tableStyles.td,
                      border: `2px solid ${COLORS.borderDark}`,
                      padding: '0.75rem',
                      textAlign: 'center',
                      color: COLORS.primary,
                      fontWeight: 600,
                    }}
                  >
                    {assessment.room_code}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
