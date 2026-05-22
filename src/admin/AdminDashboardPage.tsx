import { useEffect, useState } from 'react';
import { BookOpen, Folder, Tags, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookApi, sourceApi, tagApi, userApi } from '../api/bookdApi';
import { LoadingState } from '../components/States';

interface DashboardStats {
  books: number;
  sources: number;
  tags: number;
  users: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

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
        <h2>概览</h2>
        <div className="stats-grid">
          <Link className="stat-card" to="/admin/books">
            <BookOpen size={22} />
            <strong>{stats.books}</strong>
            <span>图书总数</span>
          </Link>
          <Link className="stat-card" to="/admin/books">
            <Folder size={22} />
            <strong>{stats.sources}</strong>
            <span>书籍源</span>
          </Link>
          <Link className="stat-card" to="/admin/tags">
            <Tags size={22} />
            <strong>{stats.tags}</strong>
            <span>标签</span>
          </Link>
          <Link className="stat-card" to="/admin/users">
            <Users size={22} />
            <strong>{stats.users}</strong>
            <span>用户</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
