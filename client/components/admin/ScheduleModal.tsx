'use client';

import type { Schedule, ScheduleCreate, SessionStatus, SessionType } from '@/types/schedule';
import type { Group, Professor, Room, Subject } from '@/types/schedule';
import { SESSION_TYPE_OPTIONS, SESSION_STATUS_OPTIONS } from './types';

type ScheduleModalProps = {
  show: boolean;
  editingSchedule: Schedule | null;
  formData: ScheduleCreate;
  metadataLoading: boolean;
  groups: Group[];
  subjects: Subject[];
  professors: Professor[];
  rooms: Room[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: ScheduleCreate) => void;
};

function renderSelect<T extends { id: number }>(
  label: string,
  items: T[],
  value: number,
  onChange: (value: number) => void,
  getLabel: (item: T) => string,
  disabled?: boolean,
) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: '500',
          color: 'black',
        }}
      >
        {label} *
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        required
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '1rem',
          color: 'black',
          backgroundColor: 'white',
          boxSizing: 'border-box',
        }}
      >
        <option value="">Selectează</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {getLabel(item)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ScheduleModal({
  show,
  editingSchedule,
  formData,
  metadataLoading,
  groups,
  subjects,
  professors,
  rooms,
  onClose,
  onSubmit,
  onFormDataChange,
}: ScheduleModalProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'black',
          }}
        >
          {editingSchedule ? 'Editează curs' : 'Adaugă curs nou'}
        </h2>

        {metadataLoading ? (
          <p>Se încarcă datele necesare...</p>
        ) : (
          <form onSubmit={onSubmit}>
            {renderSelect(
              'Grup',
              groups,
              formData.group_id,
              (value) => onFormDataChange({ ...formData, group_id: value }),
              (group) => group.code,
              metadataLoading,
            )}

            {renderSelect(
              'Materie',
              subjects,
              formData.subject_id,
              (value) => onFormDataChange({ ...formData, subject_id: value }),
              (subject) => `${subject.name} (${subject.code})`,
              metadataLoading,
            )}

            {renderSelect(
              'Profesor',
              professors,
              formData.professor_id,
              (value) => onFormDataChange({ ...formData, professor_id: value }),
              (professor) => professor.full_name,
              metadataLoading,
            )}

            {renderSelect(
              'Sală',
              rooms,
              formData.room_id,
              (value) => onFormDataChange({ ...formData, room_id: value }),
              (room) => (room.building ? `${room.code} – ${room.building}` : room.code),
              metadataLoading,
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'black',
                }}
              >
                Zi *
              </label>
              <select
                value={formData.day}
                onChange={(e) => onFormDataChange({ ...formData, day: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  color: 'black',
                  backgroundColor: 'white',
                }}
              >
                <option value="">Selectează ziua</option>
                {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map(
                  (day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'black',
                }}
              >
                Interval orar *
              </label>
              <input
                type="text"
                value={formData.hour}
                onChange={(e) => onFormDataChange({ ...formData, hour: e.target.value })}
                required
                placeholder="ex: 08:00-09:45"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  color: 'black',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'black',
                }}
              >
                Tip sesiune *
              </label>
              <select
                value={formData.session_type}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    session_type: e.target.value as SessionType,
                  })
                }
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  color: 'black',
                  backgroundColor: 'white',
                }}
              >
                {SESSION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'black',
                }}
              >
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    status: e.target.value as SessionStatus,
                  })
                }
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  color: 'black',
                  backgroundColor: 'white',
                }}
              >
                {SESSION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'black',
                }}
              >
                Note
              </label>
              <textarea
                value={formData.notes ?? ''}
                onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  color: 'black',
                  resize: 'vertical',
                }}
                placeholder="Detalii opționale (ex: curs mutat, online etc.)"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Anulează
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {editingSchedule ? 'Salvează modificările' : 'Adaugă curs'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

