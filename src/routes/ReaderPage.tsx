import { useEffect, useState } from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import type { User } from '../api/types';
import { clearSession, getRoleText } from '../auth/session';
import { LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import { LanguageSelector, useI18n } from '../i18n';

export function ReaderPage() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    authApi.me().then(setUser).catch(() => {
      clearSession();
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  }

  if (!user) return <LoadingState label={t('reader.loadingUser')} />;

  return (
    <main className="reader-shell">
      <section className="reader-panel">
        <BookOpen size={52} />
        <h1>{t('reader.title')}</h1>
        <p>{t('reader.subtitle')}</p>
        <LanguageSelector />
        <div className="user-summary">
          <span>{t('reader.currentLogin')}</span>
          <strong>
            {user.username} · {getRoleText(user.role)}
          </strong>
        </div>
        {user.role === 'admin' && (
          <button className="button secondary" type="button" onClick={() => navigate('/admin')}>
            {t('reader.enterAdmin')}
          </button>
        )}
        <button
          className="button danger"
          type="button"
          onClick={() => {
            showToast(t('reader.loggedOut'), 'info');
            void logout();
          }}
        >
          <LogOut size={18} />
          {t('reader.logout')}
        </button>
      </section>
    </main>
  );
}
