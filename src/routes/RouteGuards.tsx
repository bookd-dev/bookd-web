import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import type { User } from '../api/types';
import { destinationForRole, resolveRootDestination } from '../auth/routing';
import { clearSession, getStoredToken, getStoredUser } from '../auth/session';
import { LoadingState } from '../components/States';
import { useI18n } from '../i18n';

type GuardState = 'loading' | 'allowed' | 'login' | 'reader';

export function RootRedirect() {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const setup = await authApi.hasAdmin();
        let user: User | null = null;
        if (setup.hasAdmin && getStoredToken()) {
          try {
            user = await authApi.me();
          } catch {
            clearSession();
          }
        }
        if (!cancelled) navigate(resolveRootDestination({ hasAdmin: setup.hasAdmin, user }), { replace: true });
      } catch {
        if (!cancelled) navigate(getStoredToken() && getStoredUser() ? destinationForRole(getStoredUser()!) : '/login', { replace: true });
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return <LoadingState label={t('auth.checkingLogin')} />;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuardState>('loading');
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!getStoredToken()) {
        setState('login');
        return;
      }
      try {
        await authApi.me();
        if (!cancelled) setState('allowed');
      } catch {
        clearSession();
        if (!cancelled) setState('login');
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') return <LoadingState label={t('auth.verifyingIdentity')} />;
  if (state === 'login') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuardState>('loading');
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!getStoredToken()) {
        setState('login');
        return;
      }
      try {
        const user = await authApi.me();
        if (!cancelled) setState(user.role === 'admin' ? 'allowed' : 'reader');
      } catch {
        clearSession();
        if (!cancelled) setState('login');
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') return <LoadingState label={t('auth.verifyingAdmin')} />;
  if (state === 'login') return <Navigate to="/login" replace />;
  if (state === 'reader') return <Navigate to="/reader" replace />;
  return <>{children}</>;
}
