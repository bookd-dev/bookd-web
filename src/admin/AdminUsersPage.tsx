import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { userApi } from '../api/bookdApi';
import type { User } from '../api/types';
import { getRoleText } from '../auth/session';
import { useConfirm } from '../components/ConfirmProvider';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import { useI18n } from '../i18n';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { t } = useI18n();

  async function load() {
    setUsers(await userApi.list());
  }

  useEffect(() => {
    void load();
  }, []);

  async function deleteUser(user: User) {
    const ok = await confirm({ title: t('users.deleteTitle'), message: t('users.deleteConfirm', { username: user.username }), danger: true });
    if (!ok) return;
    try {
      await userApi.delete(user.id);
      showToast(t('users.deleted'), 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('users.deleteFailed'), 'error');
    }
  }

  return (
    <main className="page-stack">
      <section className="section">
        <h2>{t('users.title')}</h2>
        {!users ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState label={t('users.empty')} />
        ) : (
          <div className="list">
            {users.map((user) => (
              <article key={user.id} className="list-row">
                <div>
                  <strong>{user.username}</strong>
                  <span>{user.email || t('users.noEmail')} · {getRoleText(user.role)}</span>
                </div>
                {user.role !== 'admin' && (
                  <button className="button danger" type="button" onClick={() => void deleteUser(user)}>
                    <Trash2 size={16} />
                    {t('common.delete')}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
