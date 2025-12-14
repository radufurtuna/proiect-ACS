import type { SessionStatus, SessionType } from '@/types/schedule';
import type { UserCreateInput } from '@/types/auth';

export const SESSION_TYPE_OPTIONS: { label: string; value: SessionType }[] = [
  { label: 'Curs', value: 'course' },
  { label: 'Seminar', value: 'seminar' },
  { label: 'Laborator', value: 'lab' },
];

export const SESSION_STATUS_OPTIONS: { label: string; value: SessionStatus }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Mutat', value: 'moved' },
  { label: 'Anulat', value: 'canceled' },
];

export type GroupFormState = {
  id: number | null;
  code: string;
  year: string;
  faculty: string;
  specialization: string;
};

export type SubjectFormState = {
  id: number | null;
  name: string;
  code: string;
  semester: string;
};

export type ProfessorFormState = {
  id: number | null;
  full_name: string;
  department: string;
  email: string;
};

export type RoomFormState = {
  id: number | null;
  code: string;
  building: string;
  capacity: string;
};

export type UserFormState = {
  id: number | null;
  username: string;
  password: string;
  role: UserCreateInput['role'];
  group_id: number | null;
};

export const MANAGEMENT_TABS = [
  { key: 'groups', label: 'Grupe' },
  { key: 'subjects', label: 'Discipline' },
  { key: 'professors', label: 'Profesori' },
  { key: 'rooms', label: 'Săli' },
  { key: 'users', label: 'Utilizatori' },
] as const;

export type ManagerTab = (typeof MANAGEMENT_TABS)[number]['key'];

import type { ScheduleCreate } from '@/types/schedule';

export const initialScheduleForm: ScheduleCreate = {
  group_id: 0,
  subject_id: 0,
  professor_id: 0,
  room_id: 0,
  day: '',
  hour: '',
  session_type: 'course',
  status: 'normal',
  notes: null,
};

export const initialGroupForm: GroupFormState = {
  id: null,
  code: '',
  year: '',
  faculty: '',
  specialization: '',
};

export const initialSubjectForm: SubjectFormState = {
  id: null,
  name: '',
  code: '',
  semester: '',
};

export const initialProfessorForm: ProfessorFormState = {
  id: null,
  full_name: '',
  department: '',
  email: '',
};

export const initialRoomForm: RoomFormState = {
  id: null,
  code: '',
  building: '',
  capacity: '',
};

export const initialUserForm: UserFormState = {
  id: null,
  username: '',
  password: '',
  role: 'student',
  group_id: null,
};

