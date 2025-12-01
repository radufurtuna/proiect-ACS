'use client';

import React, { useState, useEffect, useRef } from 'react';
import { scheduleService, referenceDataService } from '@/lib/api';
import type { ScheduleCreate, Schedule, Group, Subject, Professor, Room } from '@/types/schedule';

const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
const TIME_SLOTS = [
  '8.00-9.30',
  '9.45-11.15',
  '11.30-13.00',
  '13.30-15.00',
  '15.15-16.45',
  '17.00-18.30',
  '18.45-20.15',
];

type CellData = {
  subject: string;
  professor: string;
  room: string;
  // Date pentru săptămâna impară
  oddWeek?: {
    subject: string;
    professor: string;
    room: string;
  };
};

type GroupColumn = {
  id: string; // ID unic temporar pentru fiecare coloană
  groupName: string; // Numele grupei (editabil în header)
  groupId?: number; // ID-ul grupei din baza de date (dacă există)
};

export default function ScheduleGrid() {
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

  const getCellKey = (day: string, hour: string) => `${day}-${hour}`;

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
        'Ești sigur că vrei să anulezi toate modificările? Toate datele nesalvate vor fi pierdute.'
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
      const schedulesToSave: ScheduleCreate[] = [];
      const missingItems: string[] = [];
      const groupsToCreate: string[] = [];
      const subjectsToCreate = new Set<string>();
      const professorsToCreate = new Set<string>();
      const roomsToCreate = new Set<string>();

      // Colectează toate entitățile care trebuie create
      for (const groupColumn of groups) {
        if (!groupColumn.groupName.trim()) {
          continue;
        }

        const groupCellData = cellData[groupColumn.id] || {};
        for (const day of DAYS) {
          for (const hour of TIME_SLOTS) {
            const key = getCellKey(day, hour);
            const data = groupCellData[key];

            if (!data || !data.subject || !data.professor || !data.room) {
              continue;
            }

            const subjectId = findIdByName(data.subject, subjects, 'name');
            const professorId = findIdByName(data.professor, professors, 'full_name');
            const roomId = findIdByName(data.room, rooms, 'code');

            if (!subjectId) subjectsToCreate.add(data.subject.trim());
            if (!professorId) professorsToCreate.add(data.professor.trim());
            if (!roomId) roomsToCreate.add(data.room.trim());
            
            // Verifică și entitățile pentru săptămâna impară
            if (data.oddWeek?.subject && data.oddWeek?.professor && data.oddWeek?.room) {
              const oddWeekSubjectId = findIdByName(data.oddWeek.subject, subjects, 'name');
              const oddWeekProfessorId = findIdByName(data.oddWeek.professor, professors, 'full_name');
              const oddWeekRoomId = findIdByName(data.oddWeek.room, rooms, 'code');
              
              if (!oddWeekSubjectId) subjectsToCreate.add(data.oddWeek.subject.trim());
              if (!oddWeekProfessorId) professorsToCreate.add(data.oddWeek.professor.trim());
              if (!oddWeekRoomId) roomsToCreate.add(data.oddWeek.room.trim());
            }
          }
        }
      }

      // Creează disciplinele care nu există
      let updatedSubjects = [...subjects];
      for (const subjectName of subjectsToCreate) {
        try {
          // Generează un cod pentru disciplină (primele 3 litere sau primele caractere)
          const code = subjectName.substring(0, 10).toUpperCase().replace(/\s+/g, '');
          const newSubject = await referenceDataService.createSubject({
            name: subjectName,
            code: code,
            semester: null,
          });
          updatedSubjects.push(newSubject);
        } catch (err: any) {
          missingItems.push(`Disciplina "${subjectName}" nu a putut fi creată: ${err.response?.data?.detail || 'Eroare necunoscută'}`);
        }
      }

      // Creează profesorii care nu există
      let updatedProfessors = [...professors];
      for (const professorName of professorsToCreate) {
        try {
          const newProfessor = await referenceDataService.createProfessor({
            full_name: professorName,
            department: null,
            email: null,
          });
          updatedProfessors.push(newProfessor);
        } catch (err: any) {
          missingItems.push(`Profesorul "${professorName}" nu a putut fi creat: ${err.response?.data?.detail || 'Eroare necunoscută'}`);
        }
      }

      // Creează sălile care nu există
      let updatedRooms = [...rooms];
      for (const roomCode of roomsToCreate) {
        try {
          const newRoom = await referenceDataService.createRoom({
            code: roomCode,
            building: null,
            capacity: null,
          });
          updatedRooms.push(newRoom);
        } catch (err: any) {
          missingItems.push(`Sala "${roomCode}" nu a putut fi creată: ${err.response?.data?.detail || 'Eroare necunoscută'}`);
        }
      }

      // Actualizează listele locale
      if (subjectsToCreate.size > 0) {
        setSubjects(updatedSubjects);
      }
      if (professorsToCreate.size > 0) {
        setProfessors(updatedProfessors);
      }
      if (roomsToCreate.size > 0) {
        setRooms(updatedRooms);
      }

      // Creează sau actualizează grupele
      for (const groupColumn of groups) {
        if (!groupColumn.groupName.trim()) {
          continue;
        }

        let group: Group | undefined;
        const newGroupName = groupColumn.groupName.trim();
        let oldGroupCode: string | null = null;

        // Dacă există un groupId, înseamnă că este o grupă existentă care poate fi redenumită
        if (groupColumn.groupId) {
          // Găsește grupa existentă după ID
          group = referenceGroups.find((g) => g.id === groupColumn.groupId);
          
          // Dacă numele s-a schimbat, actualizează grupa
          if (group && group.code !== newGroupName) {
            oldGroupCode = group.code; // Salvează numele vechi pentru a șterge schedule-urile
            
            try {
              // Actualizează numele grupei PRIMUL - asta e cel mai important
              const updatedGroup = await referenceDataService.updateGroup(group.id, {
                code: newGroupName,
                year: group.year,
                faculty: group.faculty,
                specialization: group.specialization,
              });
              
              // Actualizează state-urile imediat după succes
              setReferenceGroups((prev) => prev.map((g) => (g.id === group!.id ? updatedGroup : g)));
              setGroups((prev) => prev.map((g) => 
                g.id === groupColumn.id ? { ...g, groupName: newGroupName } : g
              ));
              group = updatedGroup;
              
              // Apoi încearcă să șteargă schedule-urile vechi (dacă există)
              // Folosește numele VECHI pentru a găsi schedule-urile care încă folosesc vechiul cod
              // Dar acum grupul are deja noul nume, deci trebuie să folosim groupId pentru a găsi schedule-urile
              try {
                // Folosește getAllSchedules și filtrează după group.id pentru a găsi schedule-urile vechi
                // Dar de fapt, schedule-urile sunt asociate cu group_id, nu cu codul, deci nu trebuie să facem nimic
                // Schedule-urile vechi vor fi asociate în continuare cu același group_id
                // Deci nu este nevoie să le ștergem - ele vor rămâne asociate cu grupul redenumit
              } catch (scheduleErr: any) {
                console.warn(`Notă la actualizarea grupei "${newGroupName}":`, scheduleErr);
              }
            } catch (err: any) {
              console.error(`Eroare la actualizarea grupei "${groupColumn.groupName}":`, err);
              missingItems.push(`Grupul "${groupColumn.groupName}" nu a putut fi actualizat: ${err.response?.data?.detail || err.message || 'Eroare necunoscută'}`);
              continue;
            }
          }
          
          // Dacă nu s-a găsit grupa după ID, continuă cu logica de creare
          if (!group) {
            group = referenceGroups.find((g) => g.code === newGroupName);
          }
        } else {
          // Nu există groupId, verifică dacă există o grupă cu acest nume
          group = referenceGroups.find((g) => g.code === newGroupName);
          
          if (!group) {
            // Creează o grupă nouă
            groupsToCreate.push(newGroupName);
            try {
              const newGroup = await referenceDataService.createGroup({
                code: newGroupName,
                year: null,
                faculty: null,
                specialization: null,
              });
              setReferenceGroups((prev) => [...prev, newGroup]);
              group = newGroup;
              
              // Actualizează groupId în coloană pentru a-l păstra pentru viitoarele salvări
              setGroups((prev) => prev.map((g) => 
                g.id === groupColumn.id ? { ...g, groupId: newGroup.id } : g
              ));
            } catch (err: any) {
              missingItems.push(`Grupul "${groupColumn.groupName}" nu a putut fi creat: ${err.response?.data?.detail || 'Eroare necunoscută'}`);
              continue;
            }
          } else {
            // Grupa există deja, actualizează groupId în coloană
            setGroups((prev) => prev.map((g) => 
              g.id === groupColumn.id ? { ...g, groupId: group!.id } : g
            ));
          }
        }

        // Verifică dacă grupul există înainte de a continua
        if (!group) {
          continue;
        }

        // Colectează datele pentru această grupă
        const groupCellData = cellData[groupColumn.id] || {};
        
        for (const day of DAYS) {
          for (const hour of TIME_SLOTS) {
            const key = getCellKey(day, hour);
            const data = groupCellData[key];

            // Skip dacă nu există date complete
            if (!data || !data.subject || !data.professor || !data.room) {
              continue;
            }

            // Găsește ID-urile pentru entitățile existente (folosind listele actualizate)
            const subjectId = findIdByName(data.subject, updatedSubjects, 'name');
            const professorId = findIdByName(data.professor, updatedProfessors, 'full_name');
            const roomId = findIdByName(data.room, updatedRooms, 'code');

            // Verifică dacă toate entitățile există
            if (!subjectId || !professorId || !roomId) {
              const missing = [];
              if (!subjectId) missing.push(`Disciplina "${data.subject}"`);
              if (!professorId) missing.push(`Profesorul "${data.professor}"`);
              if (!roomId) missing.push(`Sala "${data.room}"`);
              missingItems.push(`${groupColumn.groupName} - ${day} ${hour}: ${missing.join(', ')}`);
              continue;
            }

            // Găsește ID-urile pentru săptămâna impară (dacă există)
            let oddWeekSubjectId: number | null = null;
            let oddWeekProfessorId: number | null = null;
            let oddWeekRoomId: number | null = null;
            
            if (data.oddWeek?.subject && data.oddWeek?.professor && data.oddWeek?.room) {
              oddWeekSubjectId = findIdByName(data.oddWeek.subject, updatedSubjects, 'name');
              oddWeekProfessorId = findIdByName(data.oddWeek.professor, updatedProfessors, 'full_name');
              oddWeekRoomId = findIdByName(data.oddWeek.room, updatedRooms, 'code');
              
              // Dacă nu sunt toate datele pentru săptămâna impară, nu le includem
              if (!oddWeekSubjectId || !oddWeekProfessorId || !oddWeekRoomId) {
                oddWeekSubjectId = null;
                oddWeekProfessorId = null;
                oddWeekRoomId = null;
              }
            }

            // Creează obiectul ScheduleCreate
            schedulesToSave.push({
              group_id: group.id,
              subject_id: subjectId,
              professor_id: professorId,
              room_id: roomId,
              day: day,
              hour: hour,
              session_type: 'course',
              status: 'normal',
              notes: null,
              odd_week_subject_id: oddWeekSubjectId,
              odd_week_professor_id: oddWeekProfessorId,
              odd_week_room_id: oddWeekRoomId,
            });
          }
        }
      }

      // Reîncarcă grupele pentru a avea datele cele mai actuale (după update-uri sau creări)
      // Acest lucru este important pentru a avea numele actualizate ale grupelor
        const updatedGroups = await referenceDataService.getGroups();
        setReferenceGroups(updatedGroups);
      
      // Actualizează și groups state-ul pentru a reflecta modificările de nume
      // Aceasta asigură că UI-ul arată imediat modificările fără să aștepte reîncărcarea finală
      setGroups((prev) => prev.map((groupColumn) => {
        if (groupColumn.groupId) {
          const updatedRefGroup = updatedGroups.find((rg) => rg.id === groupColumn.groupId);
          if (updatedRefGroup && updatedRefGroup.code !== groupColumn.groupName) {
            // Actualizează numele dacă s-a schimbat
            return { ...groupColumn, groupName: updatedRefGroup.code };
          }
        }
        return groupColumn;
      }));

      // Afișează mesaje despre datele lipsă
      if (missingItems.length > 0) {
        const missingText = missingItems.slice(0, 5).join('\n');
        const moreText = missingItems.length > 5 ? `\n... și încă ${missingItems.length - 5} intrări cu date lipsă` : '';
        setMessage({
          type: 'error',
          text: `Următoarele date nu au putut fi create:\n${missingText}${moreText}`,
        });
      }

      if (schedulesToSave.length === 0) {
        if (missingItems.length === 0) {
          setMessage({ type: 'error', text: 'Nu există date complete de salvat.' });
        }
        setLoading(false);
        return;
      }

      // Obține schedule-urile existente pentru a compara cu cele noi
      const existingSchedules = await scheduleService.getAllSchedules();
      
      // Grupează schedule-urile existente după (group_id, day, hour) pentru identificare rapidă
      const existingSchedulesMap = new Map<string, Schedule>();
      for (const schedule of existingSchedules) {
        const key = `${schedule.group.id}-${schedule.day}-${schedule.hour}`;
        existingSchedulesMap.set(key, schedule);
      }

      // Creează mapare pentru schedule-urile noi
      const newSchedulesMap = new Map<string, ScheduleCreate>();
      for (const schedule of schedulesToSave) {
        const key = `${schedule.group_id}-${schedule.day}-${schedule.hour}`;
        newSchedulesMap.set(key, schedule);
      }

      // Colectează grupele care vor fi modificate
      const groupIdsToUpdate = new Set<number>();
      for (const schedule of schedulesToSave) {
        groupIdsToUpdate.add(schedule.group_id);
      }

      // Procesează fiecare schedule: UPDATE, CREATE sau DELETE
      const updatePromises: Promise<any>[] = [];
      const createPromises: Promise<any>[] = [];
      const deletePromises: Promise<void>[] = [];

      // Procesează schedule-urile noi sau modificate
      for (const [key, newSchedule] of newSchedulesMap.entries()) {
        const existingSchedule = existingSchedulesMap.get(key);
        
        if (existingSchedule) {
          // Schedule-ul există - verifică dacă trebuie actualizat
          const existingOddWeekSubjectId = existingSchedule.odd_week_subject?.id ?? null;
          const existingOddWeekProfessorId = existingSchedule.odd_week_professor?.id ?? null;
          const existingOddWeekRoomId = existingSchedule.odd_week_room?.id ?? null;
          
          const needsUpdate = 
            existingSchedule.subject.id !== newSchedule.subject_id ||
            existingSchedule.professor.id !== newSchedule.professor_id ||
            existingSchedule.room.id !== newSchedule.room_id ||
            existingOddWeekSubjectId !== newSchedule.odd_week_subject_id ||
            existingOddWeekProfessorId !== newSchedule.odd_week_professor_id ||
            existingOddWeekRoomId !== newSchedule.odd_week_room_id;
          
          if (needsUpdate) {
            // Face UPDATE doar dacă datele s-au schimbat
            updatePromises.push(
              scheduleService.updateSchedule(existingSchedule.id, {
                subject_id: newSchedule.subject_id,
                professor_id: newSchedule.professor_id,
                room_id: newSchedule.room_id,
                day: newSchedule.day,
                hour: newSchedule.hour,
                group_id: newSchedule.group_id,
                odd_week_subject_id: newSchedule.odd_week_subject_id,
                odd_week_professor_id: newSchedule.odd_week_professor_id,
                odd_week_room_id: newSchedule.odd_week_room_id,
              })
            );
          }
          // Elimină din map-ul existent pentru a marca că a fost procesat
          existingSchedulesMap.delete(key);
        } else {
          // Schedule-ul nu există - creează unul nou
          createPromises.push(scheduleService.createSchedule(newSchedule));
        }
      }

      // Șterge schedule-urile care nu mai sunt în lista nouă (au rămas în existingSchedulesMap)
      for (const existingSchedule of existingSchedulesMap.values()) {
        // Șterge doar dacă grupul a fost modificat
        if (groupIdsToUpdate.has(existingSchedule.group.id)) {
          deletePromises.push(scheduleService.deleteSchedule(existingSchedule.id));
        }
      }

      // Execută toate operațiile în paralel
      await Promise.all([...updatePromises, ...createPromises, ...deletePromises]);

      // Trimite notificări către studenții din grupele modificate
      let notificationMessage = '';
      if (groupIdsToUpdate.size > 0) {
        try {
          const notificationResults = await scheduleService.notifyScheduleChanges(Array.from(groupIdsToUpdate));
          console.log('📧 Notificări trimise:', notificationResults);
          
          if (notificationResults.total_students > 0) {
            if (notificationResults.emails_sent > 0) {
              notificationMessage = ` Email-uri de notificare trimise către ${notificationResults.emails_sent} studenți.`;
              if (notificationResults.emails_failed > 0) {
                notificationMessage += ` ${notificationResults.emails_failed} email-uri nu au putut fi trimise.`;
              }
            } else {
              notificationMessage = ` ${notificationResults.total_students} studenți au fost identificați, dar email-urile nu au putut fi trimise.`;
            }
          } else {
            notificationMessage = ' Nu există studenți în grupele modificate pentru a trimite notificări.';
          }
        } catch (err: any) {
          // Nu întrerupem fluxul dacă notificările eșuează, doar logăm eroarea
          console.warn('⚠️ Eroare la trimiterea notificărilor:', err);
          notificationMessage = ' Notificările către studenți nu au putut fi trimise.';
        }
      }

      const createdItems = [];
      if (subjectsToCreate.size > 0) createdItems.push(`${subjectsToCreate.size} disciplină(e)`);
      if (professorsToCreate.size > 0) createdItems.push(`${professorsToCreate.size} profesor(i)`);
      if (roomsToCreate.size > 0) createdItems.push(`${roomsToCreate.size} sală(i)`);
      if (groupsToCreate.length > 0) createdItems.push(`${groupsToCreate.length} grupă(e)`);

      const successText =
        createdItems.length > 0
          ? `Orarul a fost salvat cu succes!${notificationMessage}`
          : `Orarul a fost salvat cu succes!${notificationMessage}`;
      setMessage({
        type: 'success',
        text: successText,
      });
      setTimeout(() => setMessage(null), 10000);

      // Trimite refresh_all către toți clienții WebSocket conectați (după operații batch)
      // Acest lucru este mai eficient decât să trimitem mesaje individuale pentru fiecare create/update/delete
      try {
        await scheduleService.refreshAllSchedules();
        console.log('✓ Refresh WebSocket trimis către toți clienții după salvare batch');
      } catch (err) {
        // Nu întrerupem fluxul dacă WebSocket refresh eșuează
        console.warn('⚠️ Eroare la trimiterea refresh WebSocket:', err);
      }

      // Reîncarcă datele din baza de date pentru a reflecta modificările
      try {
        // Reîncarcă referenceGroups pentru a avea cele mai recente nume (după update-uri)
        const currentReferenceGroups = await referenceDataService.getGroups();
        setReferenceGroups(currentReferenceGroups);
        
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

        // Creează un map pentru a găsi schedule-urile după groupId (nu groupCode!)
        const schedulesByGroupId = new Map<number, Schedule[]>();
        const groupIdToCode = new Map<number, string>(); // Map pentru groupId -> groupCode
        for (const schedule of schedules) {
          const groupId = schedule.group.id;
          const groupCode = schedule.group.code;
          if (!schedulesByGroupId.has(groupId)) {
            schedulesByGroupId.set(groupId, []);
          }
          schedulesByGroupId.get(groupId)!.push(schedule);
          groupIdToCode.set(groupId, groupCode);
        }

        // Creează un map pentru a păstra ordinea grupurilor existente (dacă există groupId)
        // Folosește groups state-ul actualizat sau construiește din referenceGroups
        const existingGroupOrder = new Map<number, number>();
        groups.forEach((g, index) => {
          if (g.groupId) {
            existingGroupOrder.set(g.groupId, index);
          }
        });

        // Reconstruiește lista de grupe bazându-se pe schedule-uri și referenceGroups
        const newGroups: GroupColumn[] = [];
        const newCellData: Record<string, Record<string, CellData>> = {};
        const processedGroupIds = new Set<number>();

        // Sortează grupele după ordinea existentă (dacă există), apoi alfabetic
        const sortedGroupIds = Array.from(schedulesByGroupId.keys()).sort((a, b) => {
          const orderA = existingGroupOrder.get(a) ?? Infinity;
          const orderB = existingGroupOrder.get(b) ?? Infinity;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          const codeA = groupIdToCode.get(a) || '';
          const codeB = groupIdToCode.get(b) || '';
          return codeA.localeCompare(codeB);
        });

        // Procesează grupele care au schedule-uri
        for (const groupId of sortedGroupIds) {
          if (processedGroupIds.has(groupId)) {
            continue;
          }

          // Folosește referenceGroups reîncărcat pentru a avea numele actualizate
          const referenceGroup = currentReferenceGroups.find((rg) => rg.id === groupId);
          if (!referenceGroup) {
            continue; // Skip dacă grupa nu există în referenceGroups
          }

          const groupCode = referenceGroup.code;
          const groupSchedules = schedulesByGroupId.get(groupId) || [];

          // Găsește coloana existentă pentru această grupă (dacă există) pentru a păstra id-ul
          const existingColumn = groups.find((g) => g.groupId === groupId);
          
            const newGroup: GroupColumn = {
            id: existingColumn?.id || `group-${groupCode}-${Date.now()}`,
            groupName: groupCode, // Folosește numele din referenceGroups (cel actualizat)
            groupId: groupId,
            };

            newGroups.push(newGroup);
          processedGroupIds.add(groupId);

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
            newCellData[newGroup.id] = groupCellData;
        }

        // Salvează ordinea grupurilor în localStorage
        const STORAGE_KEY = 'scheduleGroupsOrder';
        const currentOrder = newGroups
          .map((g) => g.groupId)
          .filter((id): id is number => id !== undefined);
        if (currentOrder.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrder));
        }

        setGroups(newGroups);
        setCellData(newCellData);
      } catch (err) {
        console.error('Eroare la reîncărcarea datelor:', err);
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Eroare la salvare în baza de date',
      });
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
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          style={{
            padding: '0.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
          }}
          title="Adaugă"
          onClick={handleAddGroup}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          style={{
            padding: '0.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            opacity: loading ? 0.6 : 1,
          }}
          title="Salvează"
          onClick={handleSave}
          disabled={loading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </button>
        <div style={{ position: 'relative' }} ref={deleteMenuRef}>
          <button
            style={{
              padding: '0.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
            }}
            title="Șterge"
            onClick={handleDeleteClick}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
          {showDeleteMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.25rem',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '180px',
              }}
            >
              {groups.filter((group) => group.groupName.trim()).length > 0 && (
                <>
                  <div
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#666',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    Șterge grupă:
                  </div>
                  {groups
                    .filter((group) => group.groupName.trim()) // Afișează doar grupele cu nume
                    .map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleDeleteGroup(group.id)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          textAlign: 'left',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#000',
                          borderBottom: '1px solid #eee',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {group.groupName}
                      </button>
                    ))}
                  
                </>
              )}
              <button
                onClick={handleDeleteAllGroups}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#ef4444',
                  fontWeight: 'bold',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Șterge toate grupele
              </button>
            </div>
          )}
        </div>
        <button
          style={{
            padding: '0.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            opacity: loading ? 0.6 : 1,
          }}
          title="Anulează"
          onClick={handleCancel}
          disabled={loading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
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
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            border: '1px solid #000',
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
                  backgroundColor: '#f0f0f0',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#000',
                  width: '60px',
                  minWidth: '60px',
                  maxWidth: '60px',
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
                    minWidth: '150px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nume grupă"
                    value={group.groupName}
                    onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.25rem',
                      border: '1px solid #ccc',
                      borderRadius: '2px',
                      fontSize: '0.875rem',
                      color: '#000',
                      backgroundColor: '#fff',
                      textAlign: 'center',
                    }}
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
                        width: '60px',
                        minWidth: '60px',
                        maxWidth: '60px',
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
                          width: '150px',
                          minWidth: '150px',
                          maxWidth: '150px',
                          color: '#000',
                          verticalAlign: 'top',
                          overflow: 'hidden',
                        }}
                      >
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
                            value={cellData[group.id]?.[getCellKey(day, hour)]?.subject || ''}
                            onChange={(e) => handleInputChange(group.id, day, hour, 'subject', e.target.value)}
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
                            value={cellData[group.id]?.[getCellKey(day, hour)]?.professor || ''}
                            onChange={(e) => handleInputChange(group.id, day, hour, 'professor', e.target.value)}
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
                            value={cellData[group.id]?.[getCellKey(day, hour)]?.room || ''}
                            onChange={(e) => handleInputChange(group.id, day, hour, 'room', e.target.value)}
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
                            onClick={() => toggleOddWeekInputs(group.id, day, hour)}
                            style={{
                              marginTop: '0.25rem',
                              padding: '0.125rem 0.25rem',
                              fontSize: '0.65rem',
                              backgroundColor: oddWeekInputsOpen[`${group.id}-${getCellKey(day, hour)}`] ? '#b6d7a8' : '#999999',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              width: '100%',
                            }}
                            title={oddWeekInputsOpen[`${group.id}-${getCellKey(day, hour)}`] ? 'Ascunde orarul săptămânii impare' : 'Afișează orarul săptămânii impare'}
                          >
                            {oddWeekInputsOpen[`${group.id}-${getCellKey(day, hour)}`] ? '▲ Săpt. Impară' : '▼ Săpt. Impară'}
                          </button>
                          {/* Input-uri pentru săptămâna impară (afișate doar dacă butonul este activat) */}
                          {oddWeekInputsOpen[`${group.id}-${getCellKey(day, hour)}`] && (
                            <>
                              <div style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed #ccc' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                                  Săpt. Impară:
                                </div>
                                <input
                                  type="text"
                                  placeholder="Disciplină (Impar)"
                                  value={cellData[group.id]?.[getCellKey(day, hour)]?.oddWeek?.subject || ''}
                                  onChange={(e) => handleOddWeekInputChange(group.id, day, hour, 'subject', e.target.value)}
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
                                  value={cellData[group.id]?.[getCellKey(day, hour)]?.oddWeek?.professor || ''}
                                  onChange={(e) => handleOddWeekInputChange(group.id, day, hour, 'professor', e.target.value)}
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
                                  value={cellData[group.id]?.[getCellKey(day, hour)]?.oddWeek?.room || ''}
                                  onChange={(e) => handleOddWeekInputChange(group.id, day, hour, 'room', e.target.value)}
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
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

