import axios from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  UserCreateInput,
  UserUpdateInput,
} from '@/types/auth';
import type {
  Group,
  Professor,
  Room,
  Schedule,
  ScheduleCreate,
  ScheduleUpdate,
  Subject,
} from '@/types/schedule';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Creează instanța axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pentru a adăuga token-ul la fiecare request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor pentru a gestiona răspunsurile de eroare
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid sau expirat
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Redirecționează la login doar dacă nu suntem deja acolo
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Serviciu pentru autentificare
export const authService = {
  checkEmail: async (email: string): Promise<{
    exists: boolean;
    has_password: boolean;
    message: string;
  }> => {
    const response = await api.post('/auth/check-email', { email });
    return response.data;
  },

  sendVerificationCode: async (email: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.post('/auth/send-verification-code', { email });
    return response.data;
  },

  verifyCodeAndSetPassword: async (
    email: string,
    code: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-code-and-set-password', {
      email,
      code,
      password,
    });
    return {
      access_token: response.data.access_token,
      token_type: response.data.token_type || 'bearer',
      role: response.data.role,
    };
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email: credentials.username,
      password: credentials.password,
    });
    return response.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  },
};

// Serviciu pentru managementul orarului
export const scheduleService = {
  // Obține toate orarele, opțional filtrate după an academic, semestru și tip de ciclu
  getAllSchedules: async (params?: {
    academic_year?: number;
    semester?: string;
    cycle_type?: string;
  }): Promise<Schedule[]> => {
    const response = await api.get<Schedule[]>('/schedule/', { params });
    return response.data;
  },

  // Obține orarul pentru un grup specific
  getScheduleByGroup: async (group: string): Promise<Schedule[]> => {
    const response = await api.get<Schedule[]>(`/schedule/${group}`);
    return response.data;
  },

  // Obține un orar după ID
  getScheduleById: async (id: number): Promise<Schedule> => {
    const response = await api.get<Schedule>(`/schedule/id/${id}`);
    return response.data;
  },

  // Creează un nou curs
  createSchedule: async (data: ScheduleCreate): Promise<Schedule> => {
    const response = await api.post<{ message: string; data: Schedule }>('/schedule/', data);
    return response.data.data;
  },

  // Actualizează un curs existent
  updateSchedule: async (id: number, data: ScheduleUpdate): Promise<Schedule> => {
    const response = await api.put<{ message: string; data: Schedule }>(`/schedule/${id}`, data);
    return response.data.data;
  },

  // Șterge un curs
  deleteSchedule: async (id: number): Promise<void> => {
    await api.delete(`/schedule/${id}`);
  },

  // Trimite notificări către studenți pentru grupele modificate
  notifyScheduleChanges: async (modifiedGroupIds: number[]): Promise<{
    message: string;
    groups_notified: number;
    total_students: number;
    emails_sent: number;
    emails_failed: number;
  }> => {
    const response = await api.post<{
      message: string;
      groups_notified: number;
      total_students: number;
      emails_sent: number;
      emails_failed: number;
    }>('/schedule/notifications/batch', {
      modified_group_ids: modifiedGroupIds,
    });
    return response.data;
  },

  // Trimite refresh_all către toți clienții WebSocket conectați
  refreshAllSchedules: async (): Promise<{
    message: string;
    schedules_count: number;
  }> => {
    const response = await api.post<{
      message: string;
      schedules_count: number;
    }>('/schedule/refresh-all');
    return response.data;
  },
};

// Serviciu pentru entitățile de referință
export const referenceDataService = {
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/groups/');
    return response.data;
  },
  createGroup: async (data: Omit<Group, 'id'>): Promise<Group> => {
    const response = await api.post<Group>('/groups/', data);
    return response.data;
  },
  updateGroup: async (id: number, data: Partial<Group>): Promise<Group> => {
    const response = await api.put<Group>(`/groups/${id}`, data);
    return response.data;
  },
  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },
  getProfessors: async (): Promise<Professor[]> => {
    const response = await api.get<Professor[]>('/professors/');
    return response.data;
  },
  createProfessor: async (data: Omit<Professor, 'id'>): Promise<Professor> => {
    const response = await api.post<Professor>('/professors/', data);
    return response.data;
  },
  updateProfessor: async (id: number, data: Partial<Professor>): Promise<Professor> => {
    const response = await api.put<Professor>(`/professors/${id}`, data);
    return response.data;
  },
  deleteProfessor: async (id: number): Promise<void> => {
    await api.delete(`/professors/${id}`);
  },
  getSubjects: async (): Promise<Subject[]> => {
    const response = await api.get<Subject[]>('/subjects/');
    return response.data;
  },
  createSubject: async (data: Omit<Subject, 'id'>): Promise<Subject> => {
    const response = await api.post<Subject>('/subjects/', data);
    return response.data;
  },
  updateSubject: async (id: number, data: Partial<Subject>): Promise<Subject> => {
    const response = await api.put<Subject>(`/subjects/${id}`, data);
    return response.data;
  },
  deleteSubject: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
  getRooms: async (): Promise<Room[]> => {
    const response = await api.get<Room[]>('/rooms/');
    return response.data;
  },
  createRoom: async (data: Omit<Room, 'id'>): Promise<Room> => {
    const response = await api.post<Room>('/rooms/', data);
    return response.data;
  },
  updateRoom: async (id: number, data: Partial<Room>): Promise<Room> => {
    const response = await api.put<Room>(`/rooms/${id}`, data);
    return response.data;
  },
  deleteRoom: async (id: number): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },
};

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/');
    return response.data;
  },
  createUser: async (data: UserCreateInput): Promise<User> => {
    const response = await api.post<User>('/users/', data);
    return response.data;
  },
  updateUser: async (id: number, data: UserUpdateInput): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

