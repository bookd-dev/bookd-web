import { FormEvent, useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import { useToast } from '../components/ToastProvider';
import { LanguageSelector, useI18n } from '../i18n';

export function SetupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    authApi.hasAdmin().then((status) => {
      if (status.hasAdmin) navigate('/login', { replace: true });
    }).catch(() => undefined);
  }, [navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');
    const email = String(form.get('email') ?? '').trim() || null;

    if (username.length < 3) {
      showToast(t('setup.usernameTooShort'), 'error');
      return;
    }
    if (password.length < 6) {
      showToast(t('setup.passwordTooShort'), 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast(t('setup.passwordMismatch'), 'error');
      return;
    }

    setLoading(true);
    try {
      await authApi.setup(username, password, email);
      showToast(t('setup.adminCreated'), 'success');
      navigate('/login', { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('setup.createFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel setup-panel">
        <Rocket size={48} />
        <h1>{t('setup.title')}</h1>
        <p>{t('setup.subtitle')}</p>
        <LanguageSelector />
        <form className="form" onSubmit={submit}>
          <label>
            {t('auth.username')}
            <input name="username" required autoComplete="username" />
          </label>
          <label>
            {t('auth.password')}
            <input name="password" type="password" required autoComplete="new-password" />
          </label>
          <label>
            {t('setup.confirmPassword')}
            <input name="confirmPassword" type="password" required autoComplete="new-password" />
          </label>
          <label>
            {t('auth.email')}
            <input name="email" type="email" autoComplete="email" />
          </label>
          <button className="button primary full" disabled={loading} type="submit">
            {t('setup.createAdmin')}
          </button>
        </form>
      </section>
    </main>
  );
}
