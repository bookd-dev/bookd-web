import type { User } from '../api/types';

export function destinationForRole(user: User): '/admin' | '/reader' {
  return user.role === 'admin' ? '/admin' : '/reader';
}

export function resolveRootDestination(input: { hasAdmin: boolean; user: User | null }): '/setup' | '/login' | '/admin' | '/reader' {
  if (!input.hasAdmin) return '/setup';
  if (!input.user) return '/login';
  return destinationForRole(input.user);
}
