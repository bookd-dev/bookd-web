import { useEffect, useState } from 'react';
import { BookOpen, Folder, Tags, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookApi, sourceApi, tagApi, userApi } from '../api/bookdApi';
import { LoadingState } from '../components/States';
import { useI18n } from '../i18n';

interface DashboardStats {
  books: number;
  sources: number;
  tags: number;
  users: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    Promise.all([
      bookApi.count(),
      sourceApi.list(),
      tagApi.list().catch(() => []),
      userApi.list().catch(() => [])
    ]).then(([bookCount, sources, tags, users]) => {
      setStats({ books: bookCount.count, sources: sources.length, tags: tags.length, users: users.length });
    });
  }, []);

  if (!stats) return <LoadingState />;

  return (
    <main className="page-stack">
      <section className="section">
        <h2>{t('dashboard.overview')}</h2>
        <div className="stats-grid">
          <Link className="stat-card" to="/admin/books">
            <BookOpen size={22} />
            <strong>{stats.books}</strong>
            <span>{t('dashboard.totalBooks')}</span>
          </Link>
          <Link className="stat-card" to="/admin/books">
            <Folder size={22} />
            <strong>{stats.sources}</strong>
            <span>{t('dashboard.sources')}</span>
          </Link>
          <Link className="stat-card" to="/admin/tags">
            <Tags size={22} />
            <strong>{stats.tags}</strong>
            <span>{t('dashboard.tags')}</span>
          </Link>
          <Link className="stat-card" to="/admin/users">
            <Users size={22} />
            <strong>{stats.users}</strong>
            <span>{t('dashboard.users')}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
