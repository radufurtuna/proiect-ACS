'use client';

import React, { useState, useEffect, useRef } from 'react';
import { scheduleService, referenceDataService } from '@/lib/api';
import type { Schedule, Group, Subject, Professor, Room } from '@/types/schedule';
import { DAYS, TIME_SLOTS, type CellData, type GroupColumn, type ScheduleGridProps } from './ScheduleGrid.types';
import { getCellKey, findIdByName } from './ScheduleGrid.utils';
import { saveSchedule } from './ScheduleGrid.save';
import ScheduleGridCell from './ScheduleGridCell';
import ScheduleTable from './ScheduleTable';
import ScheduleTableActions from './ScheduleTableActions';

export default function ScheduleGrid({ academicYear = 1, period = null }: ScheduleGridProps = {}) {
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
  // Stare pentru a ține minte care căsuță are input-urile pentru săptămâna impară deschise
  // Format: "groupId-cellKey" => boolean
  const [oddWeekInputsOpen, setOddWeekInputsOpen] = useState<Record<string, boolean>>({});
  // Tracking pentru grupele modificate - doar acestea vor fi salvate
  const [modifiedGroups, setModifiedGroups] = useState<Set<string>>(new Set());

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

  // Încarcă schedule-urile existente și populează grila (doar la montarea componentei)
  useEffect(() => {
    const loadExistingSchedules = async () => {
      // Verifică dacă datele au fost deja încărcate sau dacă grila are deja date
      if (hasLoadedSchedules.current || groups.length > 0) {
        return;
      }

      // Verifică dacă toate datele de referință sunt încărcate
      if (referenceGroups.length === 0 || subjects.length === 0 || professors.length === 0 || rooms.length === 0) {
        return;
      }

      try {
        const schedules = await scheduleService.getAllSchedules();
        
        // Grupează schedule-urile după grup
        const schedulesByGroup = new Map<string, Schedule[]>();
        for (const schedule of schedules) {
          const groupCode = schedule.group.code;
          if (!schedulesByGroup.has(groupCode)) {
            schedulesByGroup.set(groupCode, []);
          }
          schedulesByGroup.get(groupCode)!.push(schedule);
        }

        // Creează coloanele pentru grupele care au schedule-uri
        // Folosim localStorage pentru a salva ordinea grupurilor
        const STORAGE_KEY = 'scheduleGroupsOrder';
        const savedOrder = localStorage.getItem(STORAGE_KEY);
        let groupOrder: number[] = [];
        
        if (savedOrder) {
          try {
            groupOrder = JSON.parse(savedOrder);
          } catch (e) {
            console.error('Eroare la citirea ordinii grupurilor din localStorage:', e);
          }
        }

        const groupsWithData: Array<{ groupCode: string; groupSchedules: Schedule[]; referenceGroup?: Group }> = [];
        
        for (const [groupCode, groupSchedules] of schedulesByGroup.entries()) {
          const referenceGroup = referenceGroups.find((rg) => rg.code === groupCode);
          groupsWithData.push({
            groupCode,
            groupSchedules,
            referenceGroup,
          });
        }

        // Sortăm după ordinea salvată, apoi după groupId
        groupsWithData.sort((a, b) => {
          const idA = a.referenceGroup?.id;
          const idB = b.referenceGroup?.id;
          
          if (!idA || !idB) {
            const fallbackA = idA ?? Infinity;
            const fallbackB = idB ?? Infinity;
            return fallbackA - fallbackB;
          }
          
          const indexA = groupOrder.indexOf(idA);
          const indexB = groupOrder.indexOf(idB);
          
          // Dacă ambele sunt în ordinea salvată, sortăm după poziția lor
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          
          // Dacă doar unul este în ordinea salvată, îl punem primul
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          
          // Dacă niciunul nu este în ordinea salvată, sortăm după ID
          return idA - idB;
        });

        const newGroups: GroupColumn[] = [];
        const newCellData: Record<string, Record<string, CellData>> = {};

        for (const { groupCode, groupSchedules, referenceGroup } of groupsWithData) {
          const groupId = `group-${groupCode}-${Date.now()}`;
          newGroups.push({
            id: groupId,
            groupName: groupCode,
            groupId: referenceGroup?.id,
          });

          // Populează datele pentru fiecare celulă
          const groupCellData: Record<string, CellData> = {};
          for (const schedule of groupSchedules) {
            const key = getCellKey(schedule.day, schedule.hour);
            groupCellData[key] = {
              subject: schedule.subject.name,
              professor: schedule.professor.full_name,
              room: schedule.room.code,
              oddWeek: schedule.odd_week_subject && schedule.odd_week_professor && schedule.odd_week_room ? {
                subject: schedule.odd_week_subject.name,
                professor: schedule.odd_week_professor.full_name,
                room: schedule.odd_week_room.code,
              } : undefined,
            };
          }
          newCellData[groupId] = groupCellData;
        }

        // Salvează ordinea grupurilor în localStorage
        const currentOrder = newGroups
          .map((g) => g.groupId)
          .filter((id): id is number => id !== undefined);
        if (currentOrder.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrder));
        }

        setGroups(newGroups);
        setCellData(newCellData);
        hasLoadedSchedules.current = true;
      } catch (err) {
        console.error('Eroare la încărcarea schedule-urilor existente:', err);
      }
    };

    // Așteaptă să se încarce datele de referință înainte de a încărca schedule-urile
    // Verifică dacă toate datele de referință sunt încărcate și dacă nu am încărcat deja schedule-urile
    if (referenceGroups.length > 0 && subjects.length > 0 && professors.length > 0 && rooms.length > 0) {
      loadExistingSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceGroups.length, subjects.length, professors.length, rooms.length]);

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


  const handleAddGroup = () => {
    const newGroupId = `group-${Date.now()}`;
    const newGroup: GroupColumn = {
      id: newGroupId,
      groupName: '',
    };
    setGroups((prev) => [...prev, newGroup]);
    // Inițializează datele pentru noua grupă
    setCellData((prev) => ({
      ...prev,
      [newGroupId]: {},
    }));
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

  // Handler pentru input-urile săptămânii impare
  const handleOddWeekInputChange = (groupId: string, day: string, hour: string, field: 'subject' | 'professor' | 'room', value: string) => {
    const key = getCellKey(day, hour);
    setCellData((prev) => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || {}),
        [key]: {
          ...(prev[groupId]?.[key] || { subject: '', professor: '', room: '' }),
          oddWeek: {
            ...(prev[groupId]?.[key]?.oddWeek || { subject: '', professor: '', room: '' }),
            [field]: value,
          },
        },
      },
    }));
    // Marchează grupa ca modificată
    setModifiedGroups((prev) => new Set(prev).add(groupId));
  };

  // Toggle pentru a deschide/închide input-urile săptămânii impare
  const toggleOddWeekInputs = (groupId: string, day: string, hour: string) => {
    const cellKey = `${groupId}-${getCellKey(day, hour)}`;
    setOddWeekInputsOpen((prev) => ({
      ...prev,
      [cellKey]: !prev[cellKey],
    }));
  };

  const handleDeleteClick = () => {
    setShowDeleteMenu((prev) => !prev);
  };

  const handleCancel = async () => {
    // Confirmă cu utilizatorul dacă dorește să anuleze modificările
    const hasChanges = groups.length > 0 || Object.keys(cellData).length > 0;
    
    if (hasChanges) {
      const confirmed = window.confirm(
        'Ești sigur că vrei să anulezi toate modificările?'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setLoading(true);
      setMessage(null);
      
      // Reîncarcă datele existente din baza de date
      const schedules = await scheduleService.getAllSchedules();
      
      // Grupează schedule-urile după grup
      const schedulesByGroup = new Map<string, Schedule[]>();
      for (const schedule of schedules) {
        const groupCode = schedule.group.code;
        if (!schedulesByGroup.has(groupCode)) {
          schedulesByGroup.set(groupCode, []);
        }
        schedulesByGroup.get(groupCode)!.push(schedule);
      }

      // Creează coloanele pentru grupele care au schedule-uri
      const newGroups: GroupColumn[] = [];
      const newCellData: Record<string, Record<string, CellData>> = {};

        for (const [groupCode, groupSchedules] of schedulesByGroup.entries()) {
          const groupId = `group-${groupCode}-${Date.now()}`;
          const referenceGroup = referenceGroups.find((rg) => rg.code === groupCode);
          newGroups.push({
            id: groupId,
            groupName: groupCode,
            groupId: referenceGroup?.id,
          });

        // Populează datele pentru fiecare celulă
        const groupCellData: Record<string, CellData> = {};
        for (const schedule of groupSchedules) {
          const key = getCellKey(schedule.day, schedule.hour);
          groupCellData[key] = {
            subject: schedule.subject.name,
            professor: schedule.professor.full_name,
            room: schedule.room.code,
          };
        }
        newCellData[groupId] = groupCellData;
      }

      setGroups(newGroups);
      setCellData(newCellData);
      setShowDeleteMenu(false);
      
      setMessage({
        type: 'success',
        text: 'Modificările au fost anulate. Datele au fost reîncărcate din baza de date.',
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Eroare la reîncărcarea datelor:', err);
      // Dacă apare o eroare, resetează totuși UI-ul
      setGroups([]);
      setCellData({});
      setShowDeleteMenu(false);
      setMessage({
        type: 'error',
        text: 'Eroare la reîncărcarea datelor. Grila a fost resetată.',
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
      const schedules = await scheduleService.getScheduleByGroup(groupCode);

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
      // Obține toate schedule-urile pentru toate grupele
      const allSchedules = await scheduleService.getAllSchedules();

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

  const findIdByName = (
    name: string,
    items: Array<{ id: number; name?: string; full_name?: string; code?: string }>,
    searchField: 'name' | 'full_name' | 'code' = 'name'
  ): number | null => {
    const item = items.find((item) => {
      const fieldValue = item[searchField];
      return fieldValue && fieldValue.toLowerCase().trim() === name.toLowerCase().trim();
    });
    return item?.id || null;
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await saveSchedule({
        groups,
        cellData,
        referenceGroups,
        subjects,
        professors,
        rooms,
        modifiedGroups,
        setReferenceGroups,
        setGroups,
        setSubjects,
        setProfessors,
        setRooms,
        setCellData,
        setMessage,
        setModifiedGroups,
      });
    } catch (err: any) {
      if (err.message !== 'Nu există date de salvat') {
        setMessage({
          type: 'error',
          text: err.response?.data?.detail || err.message || 'Eroare la salvare în baza de date',
        });
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '100%',
        boxSizing: 'border-box',
        display: 'inline-block',
      }}
    >
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
      <ScheduleTable
        groups={groups}
        cellData={cellData}
        oddWeekInputsOpen={oddWeekInputsOpen}
        onGroupNameChange={handleGroupNameChange}
        onInputChange={handleInputChange}
        onOddWeekInputChange={handleOddWeekInputChange}
        onToggleOddWeek={toggleOddWeekInputs}
      />
    </div>
  );
}

