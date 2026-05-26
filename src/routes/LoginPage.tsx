import { FormEvent, useEffect, useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import { destinationForRole } from '../auth/routing';
import { getStoredToken, saveSession } from '../auth/session';
import { useToast } from '../components/ToastProvider';
import { LanguageSelector, useI18n } from '../i18n';

type Tab = 'login' | 'register';

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const setup = await authApi.hasAdmin();
        if (!setup.hasAdmin) {
          navigate('/setup', { replace: true });
          return;
        }
        if (getStoredToken()) {
          const user = await authApi.me();
          if (!cancelled) navigate(destinationForRole(user), { replace: true });
        }
      } catch {
        // Keep the login form usable if the status check fails.
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const result = await authApi.login(String(form.get('username') ?? ''), String(form.get('password') ?? ''));
      saveSession(result);
      navigate(destinationForRole(result.user), { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('auth.loginFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const email = String(form.get('email') ?? '').trim() || null;
    const inviteToken = String(form.get('inviteToken') ?? '').trim();
    setLoading(true);
    try {
      if (inviteToken) {
        await authApi.registerUser(username, password, email, inviteToken);
      } else {
        await authApi.registerGuest(username, password, email);
      }
      showToast(t('auth.registerSuccess'), 'success');
      setLoginUsername(username);
      setTab('login');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('auth.registerFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>Bookd</h1>
        <p>{t('auth.subtitle')}</p>
        <LanguageSelector />
        <div className="segmented">
          <button className={tab === 'login' ? 'active' : ''} type="button" onClick={() => setTab('login')}>
            {t('auth.login')}
          </button>
          <button className={tab === 'register' ? 'active' : ''} type="button" onClick={() => setTab('register')}>
            {t('auth.register')}
          </button>
        </div>
        {tab === 'login' ? (
          <form className="form" onSubmit={handleLogin}>
            <label>
              {t('auth.username')}
              <input name="username" defaultValue={loginUsername} required autoComplete="username" />
            </label>
            <label>
              {t('auth.password')}
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <button className="button primary full" disabled={loading} type="submit">
              <LogIn size={18} />
              {t('auth.login')}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleRegister}>
            <label>
              {t('auth.username')}
              <input name="username" required autoComplete="username" />
            </label>
            <label>
              {t('auth.password')}
              <input name="password" type="password" required autoComplete="new-password" />
            </label>
            <label>
              {t('auth.email')}
              <input name="email" type="email" autoComplete="email" />
            </label>
            <label>
              {t('auth.inviteToken')}
              <input name="inviteToken" placeholder={t('auth.inviteTokenPlaceholder')} />
            </label>
            <button className="button primary full" disabled={loading} type="submit">
              <UserPlus size={18} />
              {t('auth.register')}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
