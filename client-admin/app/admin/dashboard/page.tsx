'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  authService,
  referenceDataService,
  scheduleService,
} from '@/lib/api';
import ScheduleModal from '@/components/admin/ScheduleModal';
import ScheduleGrid from '@/components/admin/ScheduleGrid';
import AssessmentScheduleGrid from '@/components/admin/AssessmentScheduleGrid';
import UserManagement from '@/components/admin/UserManagement';
import GroupsManagement from '@/components/admin/GroupsManagement';
import type {
  Group,
  Professor,
  Room,
  Schedule,
  ScheduleCreate,
  ScheduleUpdate,
  Subject,
} from '@/types/schedule';
import {
  SESSION_TYPE_OPTIONS,
  SESSION_STATUS_OPTIONS,
  MANAGEMENT_TABS,
  initialScheduleForm,
  type GroupFormState,
  type SubjectFormState,
  type ProfessorFormState,
  type RoomFormState,
  type ManagerTab,
  initialGroupForm,
  initialSubjectForm,
  initialProfessorForm,
  initialRoomForm,
} from '@/components/admin/types';
import { toNumberOrNull, toOptionalString, sanitizeNotes } from '@/components/admin/utils';
import { headerStyles, buttonStyles, inputStyles, COLORS } from '@/utils/styles';

const ACADEMIC_YEARS = [
  { key: 'schedule-year1', label: 'Anul I' },
  { key: 'schedule-year2', label: 'Anul II' },
  { key: 'schedule-year3', label: 'Anul III' },
  { key: 'schedule-year4', label: 'Anul IV' },
] as const;

const PERIODS = [
  { key: 'semester1', label: 'Orar Semestrul de toamnă' },
  { key: 'assessments1', label: 'Orar evaluarea periodică nr. 1' },
  { key: 'exams', label: 'Orar Sesiunea de examinare' },
  { key: 'assessments2', label: 'Orar evaluarea periodică nr. 2' },
  { key: 'semester2', label: 'Orar Semestrul de primăvară' },
] as const;

const NAV_ITEMS = [
  { key: 'resources', label: 'Utilizatori' },
  { key: 'groups', label: 'Grupe' },
] as const;

export default function AdminDashboard() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<ScheduleCreate>({ ...initialScheduleForm });
  const [groupForm, setGroupForm] = useState<GroupFormState>({ ...initialGroupForm });
  const [subjectForm, setSubjectForm] = useState<SubjectFormState>({ ...initialSubjectForm });
  const [professorForm, setProfessorForm] = useState<ProfessorFormState>({ ...initialProfessorForm });
  const [roomForm, setRoomForm] = useState<RoomFormState>({ ...initialRoomForm });
  const [activeView, setActiveView] = useState<'schedule-year1' | 'schedule-year2' | 'schedule-year3' | 'schedule-year4' | 'resources' | 'groups' | 'settings'>('schedule-year1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<'F' | 'FR' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [hoveredYear, setHoveredYear] = useState<string | null>(null);
  const [periodMenuPosition, setPeriodMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const yearButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State pentru Ciclul 1 Licență - FR
  const [showYearMenuFR, setShowYearMenuFR] = useState(false);
  const [hoveredYearFR, setHoveredYearFR] = useState<string | null>(null);
  const [periodMenuPositionFR, setPeriodMenuPositionFR] = useState<{ top: number; left: number } | null>(null);
  const menuRefFR = useRef<HTMLDivElement>(null);
  const yearButtonRefsFR = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const closeTimeoutRefFR = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    // Setează implicit Anul I dacă nu e selectat nimic
    if (!activeView || !activeView.startsWith('schedule-year')) {
      setActiveView('schedule-year1');
      setSelectedAcademicYear(1);
    }
    loadMetadata();
    loadSchedules();
  }, [router]);

  useEffect(() => {
    if (selectedGroup === 'all') {
      setFilteredSchedules(schedules);
    } else {
      setFilteredSchedules(schedules.filter((s) => s.group.code === selectedGroup));
    }
  }, [selectedGroup, schedules]);

  // Închide meniul când se face click în afara lui
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowYearMenu(false);
      }
    };

    if (showYearMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showYearMenu]);

  // Închide meniul pentru Ciclul 1 Licență - FR când se face click în afara lui
  useEffect(() => {
    const handleClickOutsideFR = (event: MouseEvent) => {
      if (menuRefFR.current && !menuRefFR.current.contains(event.target as Node)) {
        setShowYearMenuFR(false);
      }
    };

    if (showYearMenuFR) {
      document.addEventListener('mousedown', handleClickOutsideFR);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFR);
    };
  }, [showYearMenuFR]);

  // Cleanup timeout la unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (closeTimeoutRefFR.current) {
        clearTimeout(closeTimeoutRefFR.current);
      }
    };
  }, []);

  // Obține email-ul utilizatorului din token
  useEffect(() => {
    const email = authService.getUserEmail();
    setUserEmail(email);
  }, []);

  const uniqueGroups = useMemo(
    () => Array.from(new Set(schedules.map((s) => s.group.code))).sort(),
    [schedules],
  );

  const loadMetadata = async () => {
    try {
      setMetadataLoading(true);
      const [groupsData, subjectsData, professorsData, roomsData] = await Promise.all([
        referenceDataService.getGroups(),
        referenceDataService.getSubjects(),
        referenceDataService.getProfessors(),
        referenceDataService.getRooms(),
      ]);
      setGroups(groupsData);
      setSubjects(subjectsData);
      setProfessors(professorsData);
      setRooms(roomsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la încărcarea datelor');
    } finally {
      setMetadataLoading(false);
    }
  };


  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await scheduleService.getAllSchedules();
      setSchedules(data);
      setFilteredSchedules(data);
    } catch (err: any) {
      console.error('Eroare la încărcarea orarului:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Eroare la încărcarea orarului';
      setError(`Eroare la încărcarea orarului: ${errorMessage}. Verifică dacă serverul rulează și dacă există date corupte în baza de date.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const handleOpenModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        group_id: schedule.group.id,
        subject_id: schedule.subject.id,
        professor_id: schedule.professor.id,
        room_id: schedule.room.id,
        day: schedule.day,
        hour: schedule.hour,
        session_type: schedule.session_type,
        status: schedule.status,
        notes: schedule.notes ?? null,
      });
    } else {
      setEditingSchedule(null);
      setFormData({ ...initialScheduleForm });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({ ...initialScheduleForm });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.group_id ||
      !formData.subject_id ||
      !formData.professor_id ||
      !formData.room_id
    ) {
      setError('Te rugăm să selectezi grupă, disciplină, profesor și sală.');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const payload: ScheduleCreate = {
        ...formData,
        notes: sanitizeNotes(formData.notes ?? null),
      };

      if (editingSchedule) {
        const updatePayload: ScheduleUpdate = payload;
        await scheduleService.updateSchedule(editingSchedule.id, updatePayload);
        setSuccess('Curs actualizat cu succes!');
      } else {
        await scheduleService.createSchedule(payload);
        setSuccess('Curs adăugat cu succes!');
      }

      handleCloseModal();
      await loadSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la salvare');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError('');
      setSuccess('');
      await scheduleService.deleteSchedule(id);
      setSuccess('Curs șters cu succes!');
      setDeleteConfirm(null);
      await loadSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la ștergere');
      setDeleteConfirm(null);
    }
  };

  const resetGroupForm = () => setGroupForm({ ...initialGroupForm });
  const resetSubjectForm = () => setSubjectForm({ ...initialSubjectForm });
  const resetProfessorForm = () => setProfessorForm({ ...initialProfessorForm });
  const resetRoomForm = () => setRoomForm({ ...initialRoomForm });

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.code.trim()) {
      setError('Introduce codul grupei.');
      return;
    }

    const payload = {
      code: groupForm.code.trim(),
      year: toNumberOrNull(groupForm.year),
      faculty: toOptionalString(groupForm.faculty),
      specialization: toOptionalString(groupForm.specialization),
    };

    try {
      setError('');
      setSuccess('');
      if (groupForm.id) {
        await referenceDataService.updateGroup(groupForm.id, payload);
        setSuccess('Grupa a fost actualizată.');
      } else {
        await referenceDataService.createGroup(payload);
        setSuccess('Grupa a fost creată.');
      }
      resetGroupForm();
      await loadMetadata();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la salvarea grupei.');
    }
  };

  const handleGroupEdit = (group: Group) => {
    setGroupForm({
      id: group.id,
      code: group.code,
      year: group.year != null ? String(group.year) : '',
      faculty: group.faculty ?? '',
      specialization: group.specialization ?? '',
    });
  };

  const handleGroupDelete = async (groupId: number) => {
    if (!window.confirm('Ștergi această grupă?')) return;
    try {
      setError('');
      setSuccess('');
      await referenceDataService.deleteGroup(groupId);
      setFormData((prev) => (prev.group_id === groupId ? { ...prev, group_id: 0 } : prev));
      await loadMetadata();
      setSuccess('Grupa a fost ștearsă.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la ștergerea grupei.');
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      setError('Numele și codul disciplinei sunt obligatorii.');
      return;
    }
    const payload = {
      name: subjectForm.name.trim(),
      code: subjectForm.code.trim(),
      semester: toOptionalString(subjectForm.semester),
    };
    try {
      setError('');
      setSuccess('');
      if (subjectForm.id) {
        await referenceDataService.updateSubject(subjectForm.id, payload);
        setSuccess('Disciplina a fost actualizată.');
      } else {
        await referenceDataService.createSubject(payload);
        setSuccess('Disciplina a fost creată.');
      }
      resetSubjectForm();
      await loadMetadata();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la salvarea disciplinei.');
    }
  };

  const handleSubjectEdit = (subject: Subject) => {
    setSubjectForm({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      semester: subject.semester ?? '',
    });
  };

  const handleSubjectDelete = async (subjectId: number) => {
    if (!window.confirm('Ștergi această disciplină?')) return;
    try {
      setError('');
      setSuccess('');
      await referenceDataService.deleteSubject(subjectId);
      setFormData((prev) => (prev.subject_id === subjectId ? { ...prev, subject_id: 0 } : prev));
      await loadMetadata();
      setSuccess('Disciplina a fost ștearsă.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la ștergerea disciplinei.');
    }
  };

  const handleProfessorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorForm.full_name.trim()) {
      setError('Numele profesorului este obligatoriu.');
      return;
    }
    const payload = {
      full_name: professorForm.full_name.trim(),
      department: toOptionalString(professorForm.department),
      email: toOptionalString(professorForm.email),
    };
    try {
      setError('');
      setSuccess('');
      if (professorForm.id) {
        await referenceDataService.updateProfessor(professorForm.id, payload);
        setSuccess('Profesorul a fost actualizat.');
      } else {
        await referenceDataService.createProfessor(payload);
        setSuccess('Profesorul a fost creat.');
      }
      resetProfessorForm();
      await loadMetadata();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la salvarea profesorului.');
    }
  };

  const handleProfessorEdit = (professor: Professor) => {
    setProfessorForm({
      id: professor.id,
      full_name: professor.full_name,
      department: professor.department ?? '',
      email: professor.email ?? '',
    });
  };

  const handleProfessorDelete = async (professorId: number) => {
    if (!window.confirm('Ștergi acest profesor?')) return;
    try {
      setError('');
      setSuccess('');
      await referenceDataService.deleteProfessor(professorId);
      setFormData((prev) =>
        prev.professor_id === professorId ? { ...prev, professor_id: 0 } : prev,
      );
      await loadMetadata();
      setSuccess('Profesorul a fost șters.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la ștergerea profesorului.');
    }
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.code.trim()) {
      setError('Codul sălii este obligatoriu.');
      return;
    }
    const payload = {
      code: roomForm.code.trim(),
      building: toOptionalString(roomForm.building),
      capacity: toNumberOrNull(roomForm.capacity),
    };
    try {
      setError('');
      setSuccess('');
      if (roomForm.id) {
        await referenceDataService.updateRoom(roomForm.id, payload);
        setSuccess('Sala a fost actualizată.');
      } else {
        await referenceDataService.createRoom(payload);
        setSuccess('Sala a fost creată.');
      }
      resetRoomForm();
      await loadMetadata();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la salvarea sălii.');
    }
  };

  const handleRoomEdit = (room: Room) => {
    setRoomForm({
      id: room.id,
      code: room.code,
      building: room.building ?? '',
      capacity: room.capacity != null ? String(room.capacity) : '',
    });
  };

  const handleRoomDelete = async (roomId: number) => {
    if (!window.confirm('Ștergi această sală?')) return;
    try {
      setError('');
      setSuccess('');
      await referenceDataService.deleteRoom(roomId);
      setFormData((prev) => (prev.room_id === roomId ? { ...prev, room_id: 0 } : prev));
      await loadMetadata();
      setSuccess('Sala a fost ștearsă.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la ștergerea sălii.');
    }
  };


  const inputStyle = {
    ...inputStyles.input,
    width: '100%',
  };

  const formGridStyle = {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  };

  const actionButtons = (
    submitLabel: string,
    onCancel?: () => void,
  ) => (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
      <button
        type="submit"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.primaryHover;
          e.currentTarget.style.boxShadow = COLORS.shadow;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.primary;
          e.currentTarget.style.boxShadow = COLORS.shadowSm;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        style={{
          ...buttonStyles.primary,
          padding: '0.75rem 1.5rem',
        }}
      >
        {submitLabel}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.backgroundLight;
            e.currentTarget.style.borderColor = COLORS.borderDark;
            e.currentTarget.style.boxShadow = COLORS.shadowSm;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.white;
            e.currentTarget.style.borderColor = COLORS.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
          style={{
            ...buttonStyles.secondary,
            padding: '0.75rem 1.5rem',
          }}
        >
          Renunță
        </button>
      )}
    </div>
  );

  const renderGroupManager = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <form onSubmit={handleGroupSubmit}>
        <div style={formGridStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Cod *
            </label>
            <input
              style={inputStyle}
              value={groupForm.code}
              onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
              placeholder="Ex: TI-223"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              An
            </label>
            <input
              type="number"
              style={inputStyle}
              value={groupForm.year}
              onChange={(e) => setGroupForm({ ...groupForm, year: e.target.value })}
              placeholder="3"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Facultate
            </label>
            <input
              style={inputStyle}
              value={groupForm.faculty}
              onChange={(e) => setGroupForm({ ...groupForm, faculty: e.target.value })}
              placeholder="FCIM"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Specializare
            </label>
            <input
              style={inputStyle}
              value={groupForm.specialization}
              onChange={(e) => setGroupForm({ ...groupForm, specialization: e.target.value })}
              placeholder="Tehnologia Informației"
            />
          </div>
        </div>
        {actionButtons(groupForm.id ? 'Actualizează grupa' : 'Adaugă grupă', groupForm.id ? resetGroupForm : undefined)}
      </form>
      {metadataLoading ? (
        <p style={{ margin: 0, color: '#475569' }}>Se încarcă grupele...</p>
      ) : groups.length === 0 ? (
        <p style={{ margin: 0, color: '#475569' }}>Nu există grupele definite încă.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cod</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>An</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Facultate</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Specializare</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{group.code}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{group.year ?? '-'}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{group.faculty ?? '-'}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{group.specialization ?? '-'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleGroupEdit(group)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGroupDelete(group.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSubjectManager = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <form onSubmit={handleSubjectSubmit}>
        <div style={formGridStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Nume disciplină *
            </label>
            <input
              style={inputStyle}
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Cod *
            </label>
            <input
              style={inputStyle}
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Semestru
            </label>
            <input
              style={inputStyle}
              value={subjectForm.semester}
              onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })}
              placeholder="Semestrul I"
            />
          </div>
        </div>
        {actionButtons(
          subjectForm.id ? 'Actualizează disciplina' : 'Adaugă disciplină',
          subjectForm.id ? resetSubjectForm : undefined,
        )}
      </form>
      {metadataLoading ? (
        <p style={{ margin: 0, color: '#475569' }}>Se încarcă disciplinele...</p>
      ) : subjects.length === 0 ? (
        <p style={{ margin: 0, color: '#475569' }}>Nu există discipline definite.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nume</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cod</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Semestru</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{subject.name}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{subject.code}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{subject.semester ?? '-'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleSubjectEdit(subject)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubjectDelete(subject.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderProfessorManager = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <form onSubmit={handleProfessorSubmit}>
        <div style={formGridStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Nume complet *
            </label>
            <input
              style={inputStyle}
              value={professorForm.full_name}
              onChange={(e) => setProfessorForm({ ...professorForm, full_name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Departament
            </label>
            <input
              style={inputStyle}
              value={professorForm.department}
              onChange={(e) => setProfessorForm({ ...professorForm, department: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Email
            </label>
            <input
              type="email"
              style={inputStyle}
              value={professorForm.email}
              onChange={(e) => setProfessorForm({ ...professorForm, email: e.target.value })}
            />
          </div>
        </div>
        {actionButtons(
          professorForm.id ? 'Actualizează profesorul' : 'Adaugă profesor',
          professorForm.id ? resetProfessorForm : undefined,
        )}
      </form>
      {metadataLoading ? (
        <p style={{ margin: 0, color: '#475569' }}>Se încarcă profesorii...</p>
      ) : professors.length === 0 ? (
        <p style={{ margin: 0, color: '#475569' }}>Nu există profesori înregistrați.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nume</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Departament</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {professors.map((professor) => (
                <tr key={professor.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{professor.full_name}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{professor.department ?? '-'}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{professor.email ?? '-'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleProfessorEdit(professor)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProfessorDelete(professor.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderRoomManager = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <form onSubmit={handleRoomSubmit}>
        <div style={formGridStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Cod sală *
            </label>
            <input
              style={inputStyle}
              value={roomForm.code}
              onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })}
              placeholder="B-201"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Clădire
            </label>
            <input
              style={inputStyle}
              value={roomForm.building}
              onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: '#0f172a' }}>
              Capacitate
            </label>
            <input
              type="number"
              style={inputStyle}
              value={roomForm.capacity}
              onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
            />
          </div>
        </div>
        {actionButtons(
          roomForm.id ? 'Actualizează sala' : 'Adaugă sală',
          roomForm.id ? resetRoomForm : undefined,
        )}
      </form>
      {metadataLoading ? (
        <p style={{ margin: 0, color: '#475569' }}>Se încarcă sălile...</p>
      ) : rooms.length === 0 ? (
        <p style={{ margin: 0, color: '#475569' }}>Nu există săli definite.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cod</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Clădire</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Capacitate</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{room.code}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{room.building ?? '-'}</td>
                  <td style={{ padding: '0.75rem', color: '#0f172a' }}>{room.capacity ?? '-'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRoomEdit(room)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoomDelete(room.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );




  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header style={headerStyles.fixedHeader}>
        <h1 style={headerStyles.title}>
          Admin
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {/* Dropdown pentru Ciclul 1 Licență - F */}
          <div
            ref={menuRef}
            style={{ position: 'relative' }}
          >
            <button
              onClick={() => {
                const willOpen = !showYearMenu;
                setShowYearMenu(!showYearMenu);
                if (willOpen) {
                  // Când se deschide meniul, resetează selecțiile
                  setSelectedCycle(null);
                  setSelectedSemester(null);
                }
                // NU seta activeView - lasă view-ul curent să rămână activ
              }}
              style={{
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: 'transparent',
                color: 'black',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>Ciclul 1 Licență - F</span>
              <span style={{ fontSize: '0.65rem' }}>
                {showYearMenu ? '▲' : '▼'}
              </span>
            </button>
            
            {/* Submeniu cu anii */}
            {showYearMenu && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: '0.5rem',
                  minWidth: '180px',
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.25rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  border: '1px solid #e5e7eb',
                }}
              >
                {ACADEMIC_YEARS.map((year) => {
                  const isActive = year.key === activeView;
                  return (
                    <div
                      key={year.key}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                        setHoveredYear(year.key);
                        const button = yearButtonRefs.current[year.key];
                        if (button) {
                          const rect = button.getBoundingClientRect();
                          setPeriodMenuPosition({
                            top: rect.top,
                            left: rect.right + 8, // La dreapta butonului anului
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        closeTimeoutRef.current = setTimeout(() => {
                          setHoveredYear(null);
                          setPeriodMenuPosition(null);
                        }, 150);
                      }}
                    >
                      <button
                        ref={(el) => {
                          yearButtonRefs.current[year.key] = el;
                        }}
                        onClick={() => {
                          // Nu face nimic la click - meniul rămâne deschis
                        }}
                        style={{
                          border: 'none',
                          borderRadius: '0.375rem',
                          backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                          color: '#000',
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'block',
                          width: '100%',
                          fontSize: '0.9rem',
                          transition: 'background-color 0.2s ease',
                          marginBottom: '0.25rem',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isActive ? '#f1f5f9' : 'transparent';
                        }}
                      >
                        {year.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            </div>

            {/* Dropdown pentru Ciclul 1 Licență - FR */}
            <div
              ref={menuRefFR}
              style={{ position: 'relative' }}
            >
            <button
              onClick={() => {
                const willOpen = !showYearMenuFR;
                setShowYearMenuFR(!showYearMenuFR);
                if (willOpen) {
                  // Când se deschide meniul, resetează selecțiile
                  setSelectedCycle(null);
                  setSelectedSemester(null);
                }
                // NU seta activeView - lasă view-ul curent să rămână activ
              }}
              style={{
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: 'transparent',
                color: 'black',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>Ciclul 1 Licență - FR</span>
              <span style={{ fontSize: '0.65rem' }}>
                {showYearMenuFR ? '▲' : '▼'}
              </span>
            </button>
            
            {/* Submeniu cu anii */}
            {showYearMenuFR && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: '0.5rem',
                  minWidth: '180px',
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.25rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  border: '1px solid #e5e7eb',
                }}
              >
                {ACADEMIC_YEARS.map((year) => {
                  const isActive = year.key === activeView;
                  return (
                    <div
                      key={year.key}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => {
                        if (closeTimeoutRefFR.current) {
                          clearTimeout(closeTimeoutRefFR.current);
                          closeTimeoutRefFR.current = null;
                        }
                        setHoveredYearFR(year.key);
                        const button = yearButtonRefsFR.current[year.key];
                        if (button) {
                          const rect = button.getBoundingClientRect();
                          setPeriodMenuPositionFR({
                            top: rect.top,
                            left: rect.right + 8, // La dreapta butonului anului
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        closeTimeoutRefFR.current = setTimeout(() => {
                          setHoveredYearFR(null);
                          setPeriodMenuPositionFR(null);
                        }, 150);
                      }}
                    >
                      <button
                        ref={(el) => {
                          yearButtonRefsFR.current[year.key] = el;
                        }}
                        onClick={() => {
                          setActiveView(year.key);
                          const yearNum = parseInt(year.key.replace('schedule-year', ''), 10);
                          setSelectedAcademicYear(yearNum);
                          setShowYearMenuFR(false);
                        }}
                        style={{
                          border: 'none',
                          borderRadius: '0.375rem',
                          backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                          color: '#000',
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'block',
                          width: '100%',
                          fontSize: '0.9rem',
                          transition: 'background-color 0.2s ease',
                          marginBottom: '0.25rem',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isActive ? '#f1f5f9' : 'transparent';
                        }}
                      >
                        {year.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buton Ciclul 2 masterat */}
          <button
            style={{
              border: 'none',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              color: 'black',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Ciclul 2 masterat
          </button>

          {/* Butoanele Utilizatori */}
          {NAV_ITEMS.map((item) => {
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveView(item.key);
                  // Când se apasă pe butoane care nu sunt legate de orar, resetează selecțiile
                  setSelectedCycle(null);
                  setSelectedSemester(null);
                }}
                style={{
                  border: 'none',
                  borderRadius: '0.5rem',
                  backgroundColor: activeView === item.key ? '#f1f5f9' : 'transparent',
                  color: 'black',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeView !== item.key) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeView !== item.key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {userEmail && (
            <span style={{ 
              color: COLORS.white, 
              fontSize: '0.9rem',
              fontWeight: '400',
              opacity: 0.9
            }}>
              {userEmail}
            </span>
          )}
          <button
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.dangerHover;
              e.currentTarget.style.boxShadow = COLORS.shadow;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.danger;
              e.currentTarget.style.boxShadow = COLORS.shadowSm;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            style={{
              ...buttonStyles.danger,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Submeniu cu perioadele - apare la hover */}
      {hoveredYear && periodMenuPosition && (
        <div
          style={{
            position: 'fixed',
            top: `${periodMenuPosition.top}px`,
            left: `${periodMenuPosition.left}px`,
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            padding: '0.25rem',
            minWidth: '220px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 10000,
            border: '1px solid #e5e7eb',
          }}
          onMouseEnter={() => {
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            closeTimeoutRef.current = setTimeout(() => {
              setHoveredYear(null);
              setPeriodMenuPosition(null);
            }, 150);
          }}
        >
          {PERIODS.map((period) => {
            const yearKey = hoveredYear;
            return (
              <button
                key={period.key}
                onClick={() => {
                  setActiveView(yearKey as typeof activeView);
                  const yearNum = parseInt(yearKey.replace('schedule-year', ''), 10);
                  setSelectedAcademicYear(yearNum);
                  setSelectedSemester(period.key);
                  setSelectedCycle('F');
                  setShowYearMenu(false);
                  setHoveredYear(null);
                  setPeriodMenuPosition(null);
                }}
                style={{
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: 'transparent',
                  color: '#000',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                  fontSize: '0.85rem',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {period.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Submeniu cu perioadele pentru Ciclul 1 Licență - FR - apare la hover */}
      {hoveredYearFR && periodMenuPositionFR && (
        <div
          style={{
            position: 'fixed',
            top: `${periodMenuPositionFR.top}px`,
            left: `${periodMenuPositionFR.left}px`,
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            padding: '0.25rem',
            minWidth: '220px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 10000,
            border: '1px solid #e5e7eb',
          }}
          onMouseEnter={() => {
            if (closeTimeoutRefFR.current) {
              clearTimeout(closeTimeoutRefFR.current);
              closeTimeoutRefFR.current = null;
            }
          }}
          onMouseLeave={() => {
            closeTimeoutRefFR.current = setTimeout(() => {
              setHoveredYearFR(null);
              setPeriodMenuPositionFR(null);
            }, 150);
          }}
        >
          {PERIODS.map((period) => {
            const yearKey = hoveredYearFR;
            return (
              <button
                key={period.key}
                onClick={() => {
                  setActiveView(yearKey as typeof activeView);
                  const yearNum = parseInt(yearKey.replace('schedule-year', ''), 10);
                  setSelectedAcademicYear(yearNum);
                  setSelectedSemester(period.key);
                  setSelectedCycle('FR');
                  setShowYearMenuFR(false);
                  setHoveredYearFR(null);
                  setPeriodMenuPositionFR(null);
                }}
                style={{
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: 'transparent',
                  color: '#000',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                  fontSize: '0.85rem',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {period.label}
              </button>
            );
          })}
        </div>
      )}

      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', marginTop: '73px', overflowY: 'auto', height: 'calc(100vh - 73px)' }}>
        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#efe',
              color: '#3c3',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #cfc',
            }}
          >
            {success}
          </div>
        )}

        {/* Afișează ScheduleGrid pentru toți anii (1-4) când este selectat semester1 sau semester2 pentru F sau FR */}
        {(activeView === 'schedule-year1' || activeView === 'schedule-year2' || activeView === 'schedule-year3' || activeView === 'schedule-year4') &&
         (selectedSemester === 'semester1' || selectedSemester === 'semester2') &&
         (selectedCycle === 'F' || selectedCycle === 'FR') && (
          <ScheduleGrid academicYear={selectedAcademicYear} period={selectedSemester} cycleType={selectedCycle || null} />
        )}

        {/* Afișează AssessmentScheduleGrid pentru evaluările periodice / sesiune pentru toți anii (1-4), pentru F sau FR */}
        {(activeView === 'schedule-year1' ||
          activeView === 'schedule-year2' ||
          activeView === 'schedule-year3' ||
          activeView === 'schedule-year4') &&
         (selectedSemester === 'assessments1' ||
          selectedSemester === 'assessments2' ||
          selectedSemester === 'exams') &&
         (selectedCycle === 'F' || selectedCycle === 'FR') && (
          <AssessmentScheduleGrid
            academicYear={selectedAcademicYear}
            period={selectedSemester}
            cycleType={selectedCycle || null}
          />
        )}

        {activeView === 'resources' && <UserManagement />}

        {activeView === 'groups' && <GroupsManagement />}

        <ScheduleModal
          show={showModal}
          editingSchedule={editingSchedule}
          formData={formData}
          metadataLoading={metadataLoading}
          groups={groups}
          subjects={subjects}
          professors={professors}
          rooms={rooms}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />


      </main>
    </div>
  );
}

