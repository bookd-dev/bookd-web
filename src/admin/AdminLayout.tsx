import { useEffect, useState } from 'react';
import { BookOpen, ChartNoAxesColumn, LogOut, RefreshCw, Ticket, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import type { User } from '../api/types';
import { clearSession, getRoleText } from '../auth/session';

const navItems = [
  { to: '/admin', label: '首页', icon: ChartNoAxesColumn, end: true },
  { to: '/admin/books', label: '书籍管理', icon: BookOpen },
  { to: '/admin/background-parse', label: '后台解析', icon: RefreshCw },
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/admin/invite-tokens', label: '邀请码', icon: Ticket }
];

export function AdminLayout() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

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
            <span>管理后台</span>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Bookd 电子书管理后台</h1>
            <p>{user ? `${user.username} · ${getRoleText(user.role)}` : '管理员'}</p>
          </div>
          <button className="button danger" type="button" onClick={logout}>
            <LogOut size={18} />
            退出
          </button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
