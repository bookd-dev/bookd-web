import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { userApi } from '../api/bookdApi';
import type { User } from '../api/types';
import { getRoleText } from '../auth/session';
import { useConfirm } from '../components/ConfirmProvider';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  async function load() {
    setUsers(await userApi.list());
  }

  useEffect(() => {
    void load();
  }, []);

  async function deleteUser(user: User) {
    const ok = await confirm({ title: '删除用户', message: `确定要删除用户 "${user.username}" 吗？`, danger: true });
    if (!ok) return;
    try {
      await userApi.delete(user.id);
      showToast('用户已删除', 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    }
  }

  return (
    <main className="page-stack">
      <section className="section">
        <h2>用户管理</h2>
        {!users ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState label="暂无用户" />
        ) : (
          <div className="list">
            {users.map((user) => (
              <article key={user.id} className="list-row">
                <div>
                  <strong>{user.username}</strong>
                  <span>{user.email || '未设置邮箱'} · {getRoleText(user.role)}</span>
                </div>
                {user.role !== 'admin' && (
                  <button className="button danger" type="button" onClick={() => void deleteUser(user)}>
                    <Trash2 size={16} />
                    删除
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
