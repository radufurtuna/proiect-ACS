import { scheduleService, referenceDataService } from '@/lib/api';
import type { ScheduleCreate, Schedule, Group, Subject, Professor, Room } from '@/types/schedule';
import type { CellData, GroupColumn } from './ScheduleGrid.types';
import { DAYS, TIME_SLOTS } from './ScheduleGrid.types';
import { getCellKey, findIdByName } from './ScheduleGrid.utils';

export type SaveScheduleParams = {
  groups: GroupColumn[];
  cellData: Record<string, Record<string, CellData>>;
  referenceGroups: Group[];
  subjects: Subject[];
  professors: Professor[];
  rooms: Room[];
  modifiedGroups: Set<string>;
  academicYear?: number | null;
  semester?: string | null;
  cycleType?: string | null;
  setReferenceGroups: (groups: Group[] | ((prev: Group[]) => Group[])) => void;
  setGroups: (groups: GroupColumn[] | ((prev: GroupColumn[]) => GroupColumn[])) => void;
  setSubjects: (subjects: Subject[] | ((prev: Subject[]) => Subject[])) => void;
  setProfessors: (professors: Professor[] | ((prev: Professor[]) => Professor[])) => void;
  setRooms: (rooms: Room[] | ((prev: Room[]) => Room[])) => void;
  setCellData: (data: Record<string, Record<string, CellData>> | ((prev: Record<string, Record<string, CellData>>) => Record<string, Record<string, CellData>>)) => void;
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
  setModifiedGroups: (groups: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
};

export const saveSchedule = async (params: SaveScheduleParams): Promise<void> => {
  const {
    groups,
    cellData,
    referenceGroups,
    subjects,
    professors,
    rooms,
    modifiedGroups,
    academicYear,
    semester,
    cycleType,
    setReferenceGroups,
    setGroups,
    setSubjects,
    setProfessors,
    setRooms,
    setCellData,
    setMessage,
    setModifiedGroups,
  } = params;

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

  // Filtrează doar grupele modificate pentru a optimiza salvarea
  const groupsToProcess = modifiedGroups.size > 0 
    ? groups.filter(g => modifiedGroups.has(g.id))
    : groups;

  // Creează sau actualizează grupele (doar cele modificate)
  for (const groupColumn of groupsToProcess) {
    if (!groupColumn.groupName.trim()) {
      continue;
    }

    let group: Group | undefined;
    const newGroupName = groupColumn.groupName.trim();

    if (groupColumn.groupId) {
      group = referenceGroups.find((g) => g.id === groupColumn.groupId);
      
      if (group && group.code !== newGroupName) {
        try {
          const updatedGroup = await referenceDataService.updateGroup(group.id, {
            code: newGroupName,
            year: group.year,
            faculty: group.faculty,
            specialization: group.specialization,
          });
          
          setReferenceGroups((prev) => prev.map((g) => (g.id === group!.id ? updatedGroup : g)));
          setGroups((prev) => prev.map((g) => 
            g.id === groupColumn.id ? { ...g, groupName: newGroupName } : g
          ));
          group = updatedGroup;
        } catch (err: any) {
          console.error(`Eroare la actualizarea grupei "${groupColumn.groupName}":`, err);
          missingItems.push(`Grupul "${groupColumn.groupName}" nu a putut fi actualizat: ${err.response?.data?.detail || err.message || 'Eroare necunoscută'}`);
          continue;
        }
      }
      
      if (!group) {
        group = referenceGroups.find((g) => g.code === newGroupName);
      }
    } else {
      group = referenceGroups.find((g) => g.code === newGroupName);
      
      if (!group) {
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
          
          setGroups((prev) => prev.map((g) => 
            g.id === groupColumn.id ? { ...g, groupId: newGroup.id } : g
          ));
        } catch (err: any) {
          missingItems.push(`Grupul "${groupColumn.groupName}" nu a putut fi creat: ${err.response?.data?.detail || 'Eroare necunoscută'}`);
          continue;
        }
      } else {
        setGroups((prev) => prev.map((g) => 
          g.id === groupColumn.id ? { ...g, groupId: group!.id } : g
        ));
      }
    }

    if (!group) {
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

        const subjectId = findIdByName(data.subject, updatedSubjects, 'name');
        const professorId = findIdByName(data.professor, updatedProfessors, 'full_name');
        const roomId = findIdByName(data.room, updatedRooms, 'code');

        if (!subjectId || !professorId || !roomId) {
          const missing = [];
          if (!subjectId) missing.push(`Disciplina "${data.subject}"`);
          if (!professorId) missing.push(`Profesorul "${data.professor}"`);
          if (!roomId) missing.push(`Sala "${data.room}"`);
          missingItems.push(`${groupColumn.groupName} - ${day} ${hour}: ${missing.join(', ')}`);
          continue;
        }

        let oddWeekSubjectId: number | null = null;
        let oddWeekProfessorId: number | null = null;
        let oddWeekRoomId: number | null = null;
        
        if (data.oddWeek?.subject && data.oddWeek?.professor && data.oddWeek?.room) {
          oddWeekSubjectId = findIdByName(data.oddWeek.subject, updatedSubjects, 'name');
          oddWeekProfessorId = findIdByName(data.oddWeek.professor, updatedProfessors, 'full_name');
          oddWeekRoomId = findIdByName(data.oddWeek.room, updatedRooms, 'code');
          
          if (!oddWeekSubjectId || !oddWeekProfessorId || !oddWeekRoomId) {
            oddWeekSubjectId = null;
            oddWeekProfessorId = null;
            oddWeekRoomId = null;
          }
        }

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
          academic_year: academicYear ?? null,
          semester: semester ?? null,
          cycle_type: cycleType ?? null,
        });
      }
    }
  }

  const updatedGroups = await referenceDataService.getGroups();
  setReferenceGroups(updatedGroups);
  
  setGroups((prev) => prev.map((groupColumn) => {
    if (groupColumn.groupId) {
      const updatedRefGroup = updatedGroups.find((rg) => rg.id === groupColumn.groupId);
      if (updatedRefGroup && updatedRefGroup.code !== groupColumn.groupName) {
        return { ...groupColumn, groupName: updatedRefGroup.code };
      }
    }
    return groupColumn;
  }));

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
    throw new Error('Nu există date de salvat');
  }

  // Construiește parametrii de filtrare pentru a obține doar schedule-urile relevante
  const filterParams: {
    academic_year?: number;
    semester?: string;
    cycle_type?: string;
  } = {};
  
  if (academicYear !== undefined && academicYear !== null) {
    filterParams.academic_year = academicYear;
  }
  if (semester) {
    filterParams.semester = semester;
  }
  if (cycleType) {
    filterParams.cycle_type = cycleType;
  }

  const existingSchedules = await scheduleService.getAllSchedules(Object.keys(filterParams).length > 0 ? filterParams : undefined);
  
  const existingSchedulesMap = new Map<string, Schedule>();
  for (const schedule of existingSchedules) {
    const key = `${schedule.group.id}-${schedule.day}-${schedule.hour}`;
    existingSchedulesMap.set(key, schedule);
  }

  const newSchedulesMap = new Map<string, ScheduleCreate>();
  for (const schedule of schedulesToSave) {
    const key = `${schedule.group_id}-${schedule.day}-${schedule.hour}`;
    newSchedulesMap.set(key, schedule);
  }

  const groupIdsToUpdate = new Set<number>();
  for (const schedule of schedulesToSave) {
    groupIdsToUpdate.add(schedule.group_id);
  }

  const updatePromises: Promise<any>[] = [];
  const createPromises: Promise<any>[] = [];
  const deletePromises: Promise<void>[] = [];

  for (const [key, newSchedule] of newSchedulesMap.entries()) {
    const existingSchedule = existingSchedulesMap.get(key);
    
    if (existingSchedule) {
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
            academic_year: newSchedule.academic_year,
            semester: newSchedule.semester,
            cycle_type: newSchedule.cycle_type,
          })
        );
      }
      existingSchedulesMap.delete(key);
    } else {
      createPromises.push(scheduleService.createSchedule(newSchedule));
    }
  }

  for (const existingSchedule of existingSchedulesMap.values()) {
    if (groupIdsToUpdate.has(existingSchedule.group.id)) {
      deletePromises.push(scheduleService.deleteSchedule(existingSchedule.id));
    }
  }

  await Promise.all([...updatePromises, ...createPromises, ...deletePromises]);

  setModifiedGroups(new Set());

  try {
    await scheduleService.refreshAllSchedules();
    console.log('✓ Refresh WebSocket trimis către toți clienții după salvare batch');
  } catch (err) {
    console.warn('⚠️ Eroare la trimiterea refresh WebSocket:', err);
  }

  try {
    const currentReferenceGroups = await referenceDataService.getGroups();
    setReferenceGroups(currentReferenceGroups);
    
    // Reîncarcă schedule-urile folosind aceiași parametri de filtrare
    const schedules = await scheduleService.getAllSchedules(Object.keys(filterParams).length > 0 ? filterParams : undefined);
    
    const schedulesByGroup = new Map<string, Schedule[]>();
    for (const schedule of schedules) {
      const groupCode = schedule.group.code;
      if (!schedulesByGroup.has(groupCode)) {
        schedulesByGroup.set(groupCode, []);
      }
      schedulesByGroup.get(groupCode)!.push(schedule);
    }

    const schedulesByGroupId = new Map<number, Schedule[]>();
    const groupIdToCode = new Map<number, string>();
    for (const schedule of schedules) {
      const groupId = schedule.group.id;
      const groupCode = schedule.group.code;
      if (!schedulesByGroupId.has(groupId)) {
        schedulesByGroupId.set(groupId, []);
      }
      schedulesByGroupId.get(groupId)!.push(schedule);
      groupIdToCode.set(groupId, groupCode);
    }

    const existingGroupOrder = new Map<number, number>();
    groups.forEach((g, index) => {
      if (g.groupId) {
        existingGroupOrder.set(g.groupId, index);
      }
    });

    const newGroups: GroupColumn[] = [];
    const newCellData: Record<string, Record<string, CellData>> = {};
    const processedGroupIds = new Set<number>();

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

    for (const groupId of sortedGroupIds) {
      if (processedGroupIds.has(groupId)) {
        continue;
      }

      const referenceGroup = currentReferenceGroups.find((rg) => rg.id === groupId);
      if (!referenceGroup) {
        continue;
      }

      const groupCode = referenceGroup.code;
      const groupSchedules = schedulesByGroupId.get(groupId) || [];

      const existingColumn = groups.find((g) => g.groupId === groupId);
      
      const newGroup: GroupColumn = {
        id: existingColumn?.id || `group-${groupCode}-${Date.now()}`,
        groupName: groupCode,
        groupId: groupId,
      };

      newGroups.push(newGroup);
      processedGroupIds.add(groupId);

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
      newCellData[newGroup.id] = groupCellData;
    }

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

  const createdItems = [];
  if (subjectsToCreate.size > 0) createdItems.push(`${subjectsToCreate.size} disciplină(e)`);
  if (professorsToCreate.size > 0) createdItems.push(`${professorsToCreate.size} profesor(i)`);
  if (roomsToCreate.size > 0) createdItems.push(`${roomsToCreate.size} sală(i)`);
  if (groupsToCreate.length > 0) createdItems.push(`${groupsToCreate.length} grupă(e)`);

  const successText = createdItems.length > 0
    ? `Orarul a fost salvat cu succes!`
    : `Orarul a fost salvat cu succes!`;
  setMessage({
    type: 'success',
    text: successText,
  });
  setTimeout(() => setMessage(null), 10000);
};
