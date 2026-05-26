import type { User } from '../api/types';
import { translate } from '../i18n';

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
  if (role === 'admin') return translate('roles.admin');
  if (role === 'user') return translate('roles.user');
  if (role === 'guest') return translate('roles.guest');
  return role;
}
