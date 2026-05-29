import { useEffect, useState } from 'react';
import { BookOpen, ChartNoAxesColumn, LogOut, RefreshCw, Settings, Ticket, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import type { User } from '../api/types';
import { clearSession, getRoleText } from '../auth/session';
import { LanguageSelector, useI18n, type I18nKey } from '../i18n';

const navItems = [
  { to: '/admin', labelKey: 'adminLayout.navHome', icon: ChartNoAxesColumn, end: true },
  { to: '/admin/books', labelKey: 'adminLayout.navBooks', icon: BookOpen },
  { to: '/admin/background-parse', labelKey: 'adminLayout.navBackgroundParse', icon: RefreshCw },
  { to: '/admin/personalization', labelKey: 'adminLayout.navPersonalization', icon: Settings },
  { to: '/admin/users', labelKey: 'adminLayout.navUsers', icon: Users },
  { to: '/admin/invite-tokens', labelKey: 'adminLayout.navInviteTokens', icon: Ticket }
] satisfies Array<{ to: string; labelKey: I18nKey; icon: typeof BookOpen; end?: boolean }>;

export function AdminLayout() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    authApi.me().then(setUser).catch(() => undefined);
  }, []);

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">
          <BookOpen size={28} />
          <div>
            <strong>Bookd</strong>
            <span>{t('adminLayout.brandSubtitle')}</span>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={18} />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{t('adminLayout.title')}</h1>
            <p>{user ? `${user.username} · ${getRoleText(user.role)}` : t('roles.admin')}</p>
          </div>
          <div className="topbar-actions">
            <LanguageSelector compact />
            <button className="button danger" type="button" onClick={logout}>
              <LogOut size={18} />
              {t('adminLayout.logout')}
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
