import { useEffect, useState } from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import type { User } from '../api/types';
import { clearSession, getRoleText } from '../auth/session';
import { LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';

export function ReaderPage() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  if (!user) return <LoadingState label="正在加载用户信息..." />;

  return (
    <main className="reader-shell">
      <section className="reader-panel">
        <BookOpen size={52} />
        <h1>Bookd 电子书阅读器</h1>
        <p>网页阅读器正在开发中，此入口已迁入 React Web 壳。</p>
        <div className="user-summary">
          <span>当前登录</span>
          <strong>
            {user.username} · {getRoleText(user.role)}
          </strong>
        </div>
        {user.role === 'admin' && (
          <button className="button secondary" type="button" onClick={() => navigate('/admin')}>
            进入管理后台
          </button>
        )}
        <button
          className="button danger"
          type="button"
          onClick={() => {
            showToast('已退出登录', 'info');
            void logout();
          }}
        >
          <LogOut size={18} />
          退出登录
        </button>
      </section>
    </main>
  );
}
