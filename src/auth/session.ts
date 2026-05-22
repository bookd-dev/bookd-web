import type { User } from '../api/types';

export interface Session {
  token: string;
  user: User;
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem('authToken');
}

export function getStoredUser(): User | null {
  const raw = window.localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  window.localStorage.setItem('authToken', session.token);
  window.localStorage.setItem('user', JSON.stringify(session.user));
}

export function clearSession(): void {
  window.localStorage.removeItem('authToken');
  window.localStorage.removeItem('user');
}

export function getRoleText(role: string): string {
  if (role === 'admin') return '管理员';
  if (role === 'user') return '普通用户';
  if (role === 'guest') return '访客';
  return role;
}
