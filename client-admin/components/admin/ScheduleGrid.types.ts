export const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'] as const;

export const TIME_SLOTS = [
  '8.00-9.30',
  '9.45-11.15',
  '11.30-13.00',
  '13.30-15.00',
  '15.15-16.45',
  '17.00-18.30',
  '18.45-20.15',
] as const;

export type CellData = {
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

export type GroupColumn = {
  id: string; // ID unic temporar pentru fiecare coloană
  groupName: string; // Numele grupei (editabil în header)
  groupId?: number; // ID-ul grupei din baza de date (dacă există)
};

export type ScheduleGridProps = {
  academicYear?: number; // Anul academic (1, 2, 3, sau 4)
  period?: string | null; // Perioada academică (semester1, assessments1, exams, assessments2, semester2)
};
