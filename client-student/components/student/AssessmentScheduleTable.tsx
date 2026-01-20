'use client';

import React from 'react';
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
          color: '#666',
          backgroundColor: 'white',
          borderRadius: '8px',
        }}
      >
        Nu există evaluări periodice pentru grupul selectat.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
          border: '2px solid #000',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: '2px solid #000',
                padding: '0.75rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '250px',
              }}
            >
              Disciplina
            </th>
            <th
              style={{
                border: '2px solid #000',
                padding: '0.75rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '300px',
              }}
            >
              Componența seriei (grupele)
            </th>
            <th
              style={{
                border: '2px solid #000',
                padding: '0.75rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '200px',
              }}
            >
              Cadrul didactic titular
            </th>
            <th
              style={{
                border: '2px solid #000',
                padding: '0.75rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '120px',
              }}
            >
              Data
            </th>
            <th
              style={{
                border: '2px solid #000',
                padding: '0.75rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
                width: '100px',
              }}
            >
              Ora
            </th>
            <th
              style={{
                border: '2px solid #000',
                padding: '0.75rem',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#000',
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
                        border: '2px solid #000',
                        padding: '0.75rem',
                        textAlign: 'center',
                        color: '#000',
                        verticalAlign: 'middle',
                        fontWeight: '500',
                      }}
                    >
                      {subject}
                    </td>
                  )}
                   <td
                     style={{
                       border: '2px solid #000',
                       padding: '0.75rem',
                       textAlign: 'center',
                       color: '#000',
                     }}
                   >
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%', justifyContent: 'center' }}>
                       <span
                         style={{
                           fontSize: '1rem',
                           fontWeight: 'normal',
                           color: '#000',
                           minWidth: '25px',
                           textAlign: 'center',
                           paddingTop: '0.25rem',
                           flexShrink: 0,
                         }}
                       >
                         {index + 1}.
                       </span>
                       <span style={{ flex: 1, textAlign: 'center' }}>{assessment.groups_composition}</span>
                     </div>
                   </td>
                  <td
                    style={{
                      border: '2px solid #000',
                      padding: '0.75rem',
                      textAlign: 'center',
                      color: '#000',
                    }}
                  >
                    {assessment.professor_name}
                  </td>
                  <td
                    style={{
                      border: '2px solid #000',
                      padding: '0.75rem',
                      textAlign: 'center',
                      color: '#000',
                    }}
                  >
                    {assessment.assessment_date}
                  </td>
                  <td
                    style={{
                      border: '2px solid #000',
                      padding: '0.75rem',
                      textAlign: 'center',
                      color: '#000',
                    }}
                  >
                    {assessment.assessment_time}
                  </td>
                  <td
                    style={{
                      border: '2px solid #000',
                      padding: '0.75rem',
                      textAlign: 'center',
                      color: '#000',
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
