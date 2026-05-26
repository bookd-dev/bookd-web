import { resolveRootDestination, destinationForRole } from '../../src/auth/routing';
import type { User } from '../../src/api/types';

const admin: User = { id: 1, username: 'admin', email: null, role: 'admin' };
const user: User = { id: 2, username: 'reader', email: null, role: 'user' };

describe('auth routing', () => {
  test('sends first run to setup', () => {
    expect(resolveRootDestination({ hasAdmin: false, user: null })).toBe('/setup');
  });

  test('sends anonymous configured system to login', () => {
    expect(resolveRootDestination({ hasAdmin: true, user: null })).toBe('/login');
  });

  test('sends admin to admin and user to reader', () => {
    expect(resolveRootDestination({ hasAdmin: true, user: admin })).toBe('/admin');
    expect(resolveRootDestination({ hasAdmin: true, user })).toBe('/reader');
    expect(destinationForRole(admin)).toBe('/admin');
    expect(destinationForRole(user)).toBe('/reader');
  });
});
