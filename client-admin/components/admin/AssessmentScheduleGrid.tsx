'use client';

import React, { useState, useEffect, useRef } from 'react';
import { scheduleService, referenceDataService } from '@/lib/api';
import type { Schedule, Group, Subject, Professor, Room } from '@/types/schedule';
import { DAYS, TIME_SLOTS, type CellData, type GroupColumn, type ScheduleGridProps } from './ScheduleGrid.types';
import { getCellKey, findIdByName } from './ScheduleGrid.utils';
import { saveSchedule } from './ScheduleGrid.save';
import { saveAssessmentSchedule, loadAssessmentSchedules } from './AssessmentScheduleGrid.save';
import AssessmentScheduleGridCell from './AssessmentScheduleGridCell';
import AssessmentScheduleTable from './AssessmentScheduleTable';
import ScheduleTableActions from './ScheduleTableActions';
import ScheduleGridContainer from './ScheduleGridContainer';

// Tip pentru datele unui rând din tabelul de evaluare periodică
export type AssessmentRow = {
  id: string;
  subject: string; // Disciplina
  groups: string[]; // Componenţa seriei (grupele) - array de nume de grupe
  professors: string[]; // Cadrul didactic titular - array pentru fiecare grupă
  dates: string[]; // Data - array pentru fiecare grupă
  times: string[]; // Ora - array pentru fiecare grupă
  rooms: string[]; // Sala - array pentru fiecare grupă
};

export default function AssessmentScheduleGrid({ academicYear = 1, period = null, cycleType = null }: ScheduleGridProps = {}) {
  const [groups, setGroups] = useState<GroupColumn[]>([]);
  const [cellData, setCellData] = useState<Record<string, Record<string, CellData>>>({}); // [groupId][cellKey] = CellData
  const [referenceGroups, setReferenceGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  const hasLoadedSchedules = useRef(false);
  // Tracking pentru grupele modificate - doar acestea vor fi salvate
  const [modifiedGroups, setModifiedGroups] = useState<Set<string>>(new Set());
  // Rânduri pentru tabelul de evaluare periodică
  const [assessmentRows, setAssessmentRows] = useState<AssessmentRow[]>([]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [groupsData, subjectsData, professorsData, roomsData] = await Promise.all([
          referenceDataService.getGroups(),
          referenceDataService.getSubjects(),
          referenceDataService.getProfessors(),
          referenceDataService.getRooms(),
        ]);
        setReferenceGroups(groupsData);
        setSubjects(subjectsData);
        setProfessors(professorsData);
        setRooms(roomsData);
      } catch (err) {
        console.error('Eroare la încărcarea datelor de referință:', err);
      }
    };
    loadReferenceData();
  }, []);

  // Încarcă evaluările periodice existente (doar pentru assessmentRows)
  useEffect(() => {
    const loadExistingAssessmentSchedules = async () => {
      // Verifică dacă datele au fost deja încărcate
      if (hasLoadedSchedules.current || assessmentRows.length > 0) {
        return;
      }

      // Verifică dacă avem parametrii necesari
      if (!period || !academicYear) {
        return;
      }

      try {
        const loadedRows = await loadAssessmentSchedules(academicYear, period, cycleType);
        if (loadedRows.length > 0) {
          setAssessmentRows(loadedRows);
        hasLoadedSchedules.current = true;
        }
      } catch (err) {
        console.error('Eroare la încărcarea evaluărilor periodice:', err);
      }
    };

    // Încarcă evaluările periodice dacă avem parametrii
    if (period && academicYear) {
      loadExistingAssessmentSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, academicYear, cycleType]);

  // Închide meniul când se face click în afara lui
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false);
      }
    };

    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteMenu]);


  // Pentru evaluarea periodică, adaugă un rând nou în loc de o grupă
  const handleAddGroup = () => {
    const newRowId = `row-${Date.now()}`;
    const newRow: AssessmentRow = {
      id: newRowId,
      subject: '',
      groups: [],
      professors: [],
      dates: [],
      times: [],
      rooms: [],
    };
    setAssessmentRows((prev) => [...prev, newRow]);
  };

  const handleGroupNameChange = (groupId: string, newName: string) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, groupName: newName } : g)));
    // Marchează grupa ca modificată când se schimbă numele
    setModifiedGroups((prev) => new Set(prev).add(groupId));
  };

  const handleInputChange = (groupId: string, day: string, hour: string, field: keyof CellData, value: string) => {
    const key = getCellKey(day, hour);
    setCellData((prev) => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || {}),
        [key]: {
          ...(prev[groupId]?.[key] || { subject: '', professor: '', room: '' }),
          [field]: value,
        },
      },
    }));
    // Marchează grupa ca modificată
    setModifiedGroups((prev) => new Set(prev).add(groupId));
  };

  const handleDeleteClick = () => {
    setShowDeleteMenu((prev) => !prev);
  };

  const handleCancel = async () => {
    // Confirmă cu utilizatorul dacă dorește să anuleze modificările
    const hasChanges = assessmentRows.length > 0;
    
    if (hasChanges) {
      const confirmed = window.confirm(
        'Ești sigur că vrei să anulezi toate modificările?'
      );
      if (!confirmed) {
        return;
      }
    }

    if (!period || academicYear === undefined || academicYear === null) {
      setMessage({
        type: 'error',
        text: 'Lipsește anul academic sau perioada. Verifică selecțiile.',
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      // Reîncarcă evaluările periodice din baza de date
      const loadedRows = await loadAssessmentSchedules(academicYear, period, cycleType);

      // Păstrează doar rândurile goale/nesalvate? Cerința: rândurile salvate să revină,
      // cele goale/nesalvate să dispară. Reîncărcarea din DB le elimină automat.
      setAssessmentRows(loadedRows);
      setShowDeleteMenu(false);

      setMessage({
        type: 'success',
        text: 'Modificările au fost anulate. Evaluările au fost reîncărcate din baza de date.',
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Eroare la reîncărcarea evaluărilor periodice:', err);
      setMessage({
        type: 'error',
        text: 'Eroare la reîncărcarea evaluărilor periodice.',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || !group.groupName.trim()) {
      setShowDeleteMenu(false);
      return;
    }

    try {
      setLoading(true);
      // Obține toate schedule-urile pentru această grupă
      const groupCode = group.groupName.trim();
      
      // Construiește parametrii de filtrare
      const filterParams: {
        academic_year?: number;
        semester?: string;
        cycle_type?: string;
      } = {};
      
      if (academicYear !== undefined && academicYear !== null) {
        filterParams.academic_year = academicYear;
      }
      if (period) {
        filterParams.semester = period;
      }
      if (cycleType) {
        filterParams.cycle_type = cycleType;
      }
      
      const allSchedules = await scheduleService.getAllSchedules(Object.keys(filterParams).length > 0 ? filterParams : undefined);
      const schedules = allSchedules.filter((s) => s.group.code === groupCode);

      // Colectează ID-urile disciplinelor, profesorilor și sălilor folosite în aceste schedule-uri
      const subjectIds = new Set(schedules.map((s) => s.subject.id));
      const professorIds = new Set(schedules.map((s) => s.professor.id));
      const roomIds = new Set(schedules.map((s) => s.room.id));

      // Șterge toate schedule-urile din baza de date
      await Promise.all(schedules.map((schedule) => scheduleService.deleteSchedule(schedule.id)));

      // Obține toate schedule-urile rămase pentru a verifica dacă entitățile mai sunt folosite
      const allRemainingSchedules = await scheduleService.getAllSchedules();
      const remainingSubjectIds = new Set(allRemainingSchedules.map((s) => s.subject.id));
      const remainingProfessorIds = new Set(allRemainingSchedules.map((s) => s.professor.id));
      const remainingRoomIds = new Set(allRemainingSchedules.map((s) => s.room.id));

      // Șterge disciplinele care nu mai sunt folosite
      for (const subjectId of subjectIds) {
        if (!remainingSubjectIds.has(subjectId)) {
          try {
            await referenceDataService.deleteSubject(subjectId);
            setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
          } catch (err: any) {
            console.error(`Eroare la ștergerea disciplinei ${subjectId}:`, err);
          }
        }
      }

      // Șterge profesorii care nu mai sunt folosiți
      for (const professorId of professorIds) {
        if (!remainingProfessorIds.has(professorId)) {
          try {
            await referenceDataService.deleteProfessor(professorId);
            setProfessors((prev) => prev.filter((p) => p.id !== professorId));
          } catch (err: any) {
            console.error(`Eroare la ștergerea profesorului ${professorId}:`, err);
          }
        }
      }

      // Șterge sălile care nu mai sunt folosite
      for (const roomId of roomIds) {
        if (!remainingRoomIds.has(roomId)) {
          try {
            await referenceDataService.deleteRoom(roomId);
            setRooms((prev) => prev.filter((r) => r.id !== roomId));
          } catch (err: any) {
            console.error(`Eroare la ștergerea sălii ${roomId}:`, err);
          }
        }
      }

      // Găsește grupa în baza de date și o șterge
      const referenceGroup = referenceGroups.find((g) => g.code === groupCode);
      if (referenceGroup) {
        await referenceDataService.deleteGroup(referenceGroup.id);
        // Actualizează lista de grupe de referință
        setReferenceGroups((prev) => prev.filter((g) => g.id !== referenceGroup.id));
      }

      // Doar dacă ștergerea a reușit, actualizează UI-ul
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setCellData((prev) => {
        const newData = { ...prev };
        delete newData[groupId];
        return newData;
      });
      setShowDeleteMenu(false);
      setMessage({
        type: 'success',
        text: `Grupul "${groupCode}" și toate schedule-urile sale au fost șterse cu succes.`,
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      console.error('Eroare la ștergerea grupei:', err);
      setMessage({
        type: 'error',
        text: `Eroare la ștergerea grupei: ${err.response?.data?.detail || err.message || 'Eroare necunoscută'}`,
      });
      setTimeout(() => setMessage(null), 7000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllGroups = async () => {
    try {
      setLoading(true);
      
      // Construiește parametrii de filtrare
      const filterParams: {
        academic_year?: number;
        semester?: string;
        cycle_type?: string;
      } = {};
      
      if (academicYear !== undefined && academicYear !== null) {
        filterParams.academic_year = academicYear;
      }
      if (period) {
        filterParams.semester = period;
      }
      if (cycleType) {
        filterParams.cycle_type = cycleType;
      }
      
      // Obține toate schedule-urile pentru toate grupele
      const allSchedules = await scheduleService.getAllSchedules(Object.keys(filterParams).length > 0 ? filterParams : undefined);

      // Colectează ID-urile disciplinelor, profesorilor și sălilor folosite în toate schedule-urile
      const subjectIds = new Set(allSchedules.map((s) => s.subject.id));
      const professorIds = new Set(allSchedules.map((s) => s.professor.id));
      const roomIds = new Set(allSchedules.map((s) => s.room.id));

      // Șterge toate schedule-urile din baza de date
      await Promise.all(allSchedules.map((schedule) => scheduleService.deleteSchedule(schedule.id)));

      // După ștergerea tuturor schedule-urilor, toate disciplinele, profesorii și sălile nu mai sunt folosite
      // Șterge toate disciplinele care au fost folosite
      for (const subjectId of subjectIds) {
        try {
          await referenceDataService.deleteSubject(subjectId);
          setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
        } catch (err: any) {
          console.error(`Eroare la ștergerea disciplinei ${subjectId}:`, err);
        }
      }

      // Șterge toți profesorii care au fost folosiți
      for (const professorId of professorIds) {
        try {
          await referenceDataService.deleteProfessor(professorId);
          setProfessors((prev) => prev.filter((p) => p.id !== professorId));
        } catch (err: any) {
          console.error(`Eroare la ștergerea profesorului ${professorId}:`, err);
        }
      }

      // Șterge toate sălile care au fost folosite
      for (const roomId of roomIds) {
        try {
          await referenceDataService.deleteRoom(roomId);
          setRooms((prev) => prev.filter((r) => r.id !== roomId));
        } catch (err: any) {
          console.error(`Eroare la ștergerea sălii ${roomId}:`, err);
        }
      }

      // Șterge toate grupele din baza de date care au fost folosite în grilă
      const groupsToDelete = groups
        .filter((g) => g.groupName.trim())
        .map((g) => {
          const refGroup = referenceGroups.find((rg) => rg.code === g.groupName.trim());
          return refGroup?.id;
        })
        .filter((id): id is number => id !== undefined);

      await Promise.all(groupsToDelete.map((groupId) => referenceDataService.deleteGroup(groupId)));

      // Actualizează lista de grupe de referință
      const updatedReferenceGroups = await referenceDataService.getGroups();
      setReferenceGroups(updatedReferenceGroups);

      // Doar dacă ștergerea a reușit, actualizează UI-ul
      setGroups([]);
      setCellData({});
      setShowDeleteMenu(false);
      setMessage({
        type: 'success',
        text: `Toate grupele, schedule-urile, disciplinele, profesorii și sălile au fost șterse cu succes.`,
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      console.error('Eroare la ștergerea tuturor grupelor:', err);
      setMessage({
        type: 'error',
        text: `Eroare la ștergerea grupelor: ${err.response?.data?.detail || err.message || 'Eroare necunoscută'}`,
      });
      setTimeout(() => setMessage(null), 7000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Verifică dacă avem parametrii necesari
      if (!period || academicYear === undefined || academicYear === null) {
        setMessage({
          type: 'error',
          text: 'Lipsește anul academic sau perioada. Verifică selecțiile.',
        });
        return;
      }

      // Salvează evaluările periodice (assessmentRows)
      await saveAssessmentSchedule({
        assessmentRows,
        academicYear,
        semester: period,
        cycleType,
        setMessage,
      });
    } catch (err: any) {
      // Eroarea este deja setată în saveAssessmentSchedule
      console.error('Eroare la salvare:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScheduleGridContainer>
      <ScheduleTableActions
        groups={groups}
        loading={loading}
        showDeleteMenu={showDeleteMenu}
        deleteMenuRef={deleteMenuRef}
        onAddGroup={handleAddGroup}
        onSave={handleSave}
        onDeleteClick={handleDeleteClick}
        onDeleteGroup={handleDeleteGroup}
        onDeleteAllGroups={handleDeleteAllGroups}
        onCancel={handleCancel}
        academicYear={academicYear}
        selectedGroupId={null}
        onGroupFilterChange={() => {}}
        showDeleteButton={false}
        period={period}
        cycleType={cycleType}
      />
      {message && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: message.type === 'success' ? '#efe' : '#fee',
            color: message.type === 'success' ? '#3c3' : '#c33',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: `1px solid ${message.type === 'success' ? '#cfc' : '#fcc'}`,
            fontSize: '0.875rem',
            whiteSpace: 'pre-line',
          }}
        >
          {message.text}
        </div>
      )}
      <AssessmentScheduleTable
        groups={groups}
        cellData={cellData}
        assessmentRows={assessmentRows}
        onGroupNameChange={handleGroupNameChange}
        onInputChange={handleInputChange}
        onRowChange={(rowId, field, value) => {
          setAssessmentRows((prev) =>
            prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
          );
        }}
        onGroupInRowChange={(rowId, groupIndex, value) => {
          setAssessmentRows((prev) =>
            prev.map((row) => {
              if (row.id === rowId) {
                const newGroups = [...row.groups];
                newGroups[groupIndex] = value;
                return { ...row, groups: newGroups };
              }
              return row;
            })
          );
        }}
        onAddGroupToRow={(rowId) => {
          setAssessmentRows((prev) =>
            prev.map((row) => {
              if (row.id === rowId) {
                return {
                  ...row,
                  groups: [...row.groups, ''],
                  professors: [...row.professors, ''],
                  dates: [...row.dates, ''],
                  times: [...row.times, ''],
                  rooms: [...row.rooms, ''],
                };
              }
              return row;
            })
          );
        }}
        onDeleteRow={(rowId) => {
          setAssessmentRows((prev) => prev.filter((row) => row.id !== rowId));
        }}
        onProfessorInRowChange={(rowId, index, value) => {
          setAssessmentRows((prev) =>
            prev.map((row) => {
              if (row.id === rowId) {
                const newProfessors = [...row.professors];
                newProfessors[index] = value;
                return { ...row, professors: newProfessors };
              }
              return row;
            })
          );
        }}
        onDateInRowChange={(rowId, index, value) => {
          setAssessmentRows((prev) =>
            prev.map((row) => {
              if (row.id === rowId) {
                const newDates = [...row.dates];
                newDates[index] = value;
                return { ...row, dates: newDates };
              }
              return row;
            })
          );
        }}
        onTimeInRowChange={(rowId, index, value) => {
          setAssessmentRows((prev) =>
            prev.map((row) => {
              if (row.id === rowId) {
                const newTimes = [...row.times];
                newTimes[index] = value;
                return { ...row, times: newTimes };
              }
              return row;
            })
          );
        }}
        onRoomInRowChange={(rowId, index, value) => {
          setAssessmentRows((prev) =>
            prev.map((row) => {
              if (row.id === rowId) {
                const newRooms = [...row.rooms];
                newRooms[index] = value;
                return { ...row, rooms: newRooms };
              }
              return row;
            })
          );
        }}
      />
    </ScheduleGridContainer>
  );
}

