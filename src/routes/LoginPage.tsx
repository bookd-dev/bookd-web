import { FormEvent, useEffect, useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import { destinationForRole } from '../auth/routing';
import { getStoredToken, saveSession } from '../auth/session';
import { useToast } from '../components/ToastProvider';

type Tab = 'login' | 'register';

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

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
      showToast(error instanceof Error ? error.message : '登录失败', 'error');
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
      showToast('注册成功，请登录', 'success');
      setLoginUsername(username);
      setTab('login');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '注册失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>Bookd</h1>
        <p>图书管理系统</p>
        <div className="segmented">
          <button className={tab === 'login' ? 'active' : ''} type="button" onClick={() => setTab('login')}>
            登录
          </button>
          <button className={tab === 'register' ? 'active' : ''} type="button" onClick={() => setTab('register')}>
            注册
          </button>
        </div>
        {tab === 'login' ? (
          <form className="form" onSubmit={handleLogin}>
            <label>
              用户名
              <input name="username" defaultValue={loginUsername} required autoComplete="username" />
            </label>
            <label>
              密码
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <button className="button primary full" disabled={loading} type="submit">
              <LogIn size={18} />
              登录
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleRegister}>
            <label>
              用户名
              <input name="username" required autoComplete="username" />
            </label>
            <label>
              密码
              <input name="password" type="password" required autoComplete="new-password" />
            </label>
            <label>
              邮箱
              <input name="email" type="email" autoComplete="email" />
            </label>
            <label>
              邀请码
              <input name="inviteToken" placeholder="留空注册为访客" />
            </label>
            <button className="button primary full" disabled={loading} type="submit">
              <UserPlus size={18} />
              注册
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
