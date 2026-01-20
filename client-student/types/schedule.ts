export type SessionType = 'course' | 'seminar' | 'lab';
export type SessionStatus = 'normal' | 'moved' | 'canceled';

export interface Group {
  id: number;
  code: string;
  year?: number | null;
  faculty?: string | null;
  specialization?: string | null;
}

export interface Professor {
  id: number;
  full_name: string;
  department?: string | null;
  email?: string | null;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  semester?: string | null;
}

export interface Room {
  id: number;
  code: string;
  building?: string | null;
  capacity?: number | null;
}

export interface Schedule {
  id: number;
  day: string;
  hour: string;
  session_type: SessionType;
  status: SessionStatus;
  notes?: string | null;
  version: number;
  group: Group;
  subject: Subject;
  professor: Professor;
  room: Room;
  odd_week_subject?: Subject | null;
  odd_week_professor?: Professor | null;
  odd_week_room?: Room | null;
  academic_year?: number | null;
  semester?: string | null;
  cycle_type?: string | null;
}

export interface ScheduleCreate {
  group_id: number;
  subject_id: number;
  professor_id: number;
  room_id: number;
  day: string;
  hour: string;
  session_type: SessionType;
  status: SessionStatus;
  notes?: string | null;
  odd_week_subject_id?: number | null;
  odd_week_professor_id?: number | null;
  odd_week_room_id?: number | null;
  academic_year?: number | null;
  semester?: string | null;
  cycle_type?: string | null;
}

export type ScheduleUpdate = Partial<ScheduleCreate>;

// Tipuri pentru evaluările periodice
export interface AssessmentSchedule {
  id: number;
  subject: string;
  groups_composition: string;
  professor_name: string;
  assessment_date: string;
  assessment_time: string;
  room_code: string;
  academic_year: number;
  semester: string;
  cycle_type?: string | null;
}

