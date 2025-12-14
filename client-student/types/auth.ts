export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: 'admin' | 'student' | 'professor';  // Rolul utilizatorului din baza de date
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'student' | 'professor';
  group_id?: number | null;
  group_code?: string | null;
}

export interface UserCreateInput {
  username: string;
  password: string;
  role: 'admin' | 'student' | 'professor';
  group_id?: number | null;
}

export interface UserUpdateInput {
  username?: string;
  password?: string;
  role?: 'admin' | 'student' | 'professor';
  group_id?: number | null;
}

