import { assessmentScheduleService } from '@/lib/api';
import type { AssessmentSchedule, AssessmentScheduleCreate } from '@/types/schedule';
import type { AssessmentRow } from './AssessmentScheduleGrid';

/**
 * Transformă un AssessmentRow (format UI) în AssessmentScheduleCreate[] (format backend).
 * Fiecare serie de grupe (row.groups[index]) devine o intrare separată în baza de date.
 * Mai multe grupe scrise într-un câmp (row.groups[index]) au aceleași date.
 */
function transformRowToSchedules(
  row: AssessmentRow,
  academicYear: number,
  semester: string,
  cycleType: string | null
): AssessmentScheduleCreate[] {
  // Verifică dacă există date minimale
  if (!row.subject.trim()) {
    return []; // Skip rândurile fără disciplină
  }

  const schedules: AssessmentScheduleCreate[] = [];

  // Pentru fiecare serie de grupe (fiecare index în row.groups)
  for (let i = 0; i < row.groups.length; i++) {
    const groupsComposition = row.groups[i]?.trim();
    
    // Skip serie de grupe goale
    if (!groupsComposition) {
      continue;
    }

    // Folosește datele de la același index
    const professorName = row.professors[i]?.trim() || '';
    const assessmentDate = row.dates[i]?.trim() || '';
    const assessmentTime = row.times[i]?.trim() || '';
    const roomCode = row.rooms[i]?.trim() || '';

    schedules.push({
      subject: row.subject.trim(),
      groups_composition: groupsComposition, // String-ul complet care poate conține mai multe grupe separate prin virgulă
      professor_name: professorName,
      assessment_date: assessmentDate,
      assessment_time: assessmentTime,
      room_code: roomCode,
      academic_year: academicYear,
      semester: semester,
      cycle_type: cycleType || null,
    });
  }

  return schedules;
}

/**
 * Transformă AssessmentSchedule[] (format backend) în AssessmentRow[] (format UI).
 * Grupează schedule-urile după disciplină.
 * Fiecare schedule devine o serie de grupe în același rând (la același index).
 */
function transformSchedulesToRows(schedules: AssessmentSchedule[]): AssessmentRow[] {
  // Grupează schedule-urile după disciplină
  const rowsBySubject = new Map<string, AssessmentSchedule[]>();
  
  for (const schedule of schedules) {
    const subject = schedule.subject.trim();
    if (!rowsBySubject.has(subject)) {
      rowsBySubject.set(subject, []);
    }
    rowsBySubject.get(subject)!.push(schedule);
  }
  
  // Creează un AssessmentRow pentru fiecare disciplină
  const rows: AssessmentRow[] = [];
  
  for (const [subject, subjectSchedules] of rowsBySubject.entries()) {
    const groups: string[] = [];
    const professors: string[] = [];
    const dates: string[] = [];
    const times: string[] = [];
    const rooms: string[] = [];
    
    // Pentru fiecare schedule, adaugă seria de grupe cu datele sale
    for (const schedule of subjectSchedules) {
      // Păstrează string-ul complet de grupe (nu-l despartem)
      groups.push(schedule.groups_composition);
      professors.push(schedule.professor_name);
      dates.push(schedule.assessment_date);
      times.push(schedule.assessment_time);
      rooms.push(schedule.room_code);
    }
    
    if (groups.length > 0) {
      rows.push({
        id: `row-${subjectSchedules[0].id}`, // Folosește ID-ul primului schedule
        subject,
        groups,
        professors,
        dates,
        times,
        rooms,
      });
    }
  }
  
  return rows;
}

export type SaveAssessmentScheduleParams = {
  assessmentRows: AssessmentRow[];
  academicYear: number;
  semester: string;
  cycleType: string | null;
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
};

/**
 * Salvează evaluările periodice în baza de date.
 * Transformă datele din format UI în format backend și le trimite la API.
 */
export const saveAssessmentSchedule = async (params: SaveAssessmentScheduleParams): Promise<void> => {
  const { assessmentRows, academicYear, semester, cycleType, setMessage } = params;

  // Verifică dacă există date de salvat
  if (assessmentRows.length === 0) {
    setMessage({
      type: 'error',
      text: 'Nu există date de salvat. Adaugă cel puțin un rând.',
    });
    throw new Error('Nu există date de salvat');
  }

  // Transformă rândurile în format backend
  // Fiecare serie de grupe (row.groups[index]) devine o intrare separată
  const schedulesToSave: AssessmentScheduleCreate[] = [];
  for (const row of assessmentRows) {
    const rowSchedules = transformRowToSchedules(row, academicYear, semester, cycleType);
    schedulesToSave.push(...rowSchedules);
  }

  if (schedulesToSave.length === 0) {
    setMessage({
      type: 'error',
      text: 'Nu există date valide de salvat. Verifică că toate rândurile au disciplină și grupe completate.',
    });
    throw new Error('Nu există date valide de salvat');
  }

  try {
    // Obține evaluările existente pentru a șterge cele vechi (dacă există)
    const existingSchedules = await assessmentScheduleService.getAllAssessmentSchedules({
      academic_year: academicYear,
      semester: semester,
      cycle_type: cycleType || undefined,
    });

    // Șterge evaluările existente
    for (const existing of existingSchedules) {
      await assessmentScheduleService.deleteAssessmentSchedule(existing.id);
    }

    // Creează noile evaluări
    const createdSchedules: AssessmentSchedule[] = [];
    for (const scheduleData of schedulesToSave) {
      const created = await assessmentScheduleService.createAssessmentSchedule(scheduleData);
      createdSchedules.push(created);
    }

    setMessage({
      type: 'success',
      text: `${createdSchedules.length} evaluări periodice salvate cu succes!`,
    });
  } catch (err: any) {
    const errorMessage = err.response?.data?.detail || err.message || 'Eroare la salvare';
    setMessage({
      type: 'error',
      text: `Eroare la salvare: ${errorMessage}`,
    });
    throw err;
  }
};

/**
 * Încarcă evaluările periodice din baza de date și le transformă în format UI.
 */
export const loadAssessmentSchedules = async (
  academicYear: number,
  semester: string,
  cycleType: string | null
): Promise<AssessmentRow[]> => {
  try {
    const schedules = await assessmentScheduleService.getAllAssessmentSchedules({
      academic_year: academicYear,
      semester: semester,
      cycle_type: cycleType || undefined,
    });

    // Transformă schedule-urile în AssessmentRow-uri
    // Grupează după disciplină și combină seriile de grupe
    return transformSchedulesToRows(schedules);
  } catch (err: any) {
    console.error('Eroare la încărcarea evaluărilor periodice:', err);
    return [];
  }
};
