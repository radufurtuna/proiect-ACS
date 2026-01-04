import type { Group, Subject, Professor, Room } from '@/types/schedule';
import type { CellData, GroupColumn } from './ScheduleGrid.types';

export const getCellKey = (day: string, hour: string) => `${day}-${hour}`;

export const findIdByName = <T extends { id: number }>(
  name: string,
  items: T[],
  searchField: keyof T
): number | null => {
  const item = items.find((item) => {
    const fieldValue = item[searchField];
    return fieldValue && String(fieldValue).toLowerCase().trim() === name.toLowerCase().trim();
  });
  return item?.id || null;
};
