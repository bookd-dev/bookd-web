import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { userApi } from '../api/bookdApi';
import type { InviteToken } from '../api/types';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';

export function AdminInviteTokensPage() {
  const [tokens, setTokens] = useState<InviteToken[] | null>(null);
  const { showToast } = useToast();

  async function load() {
    setTokens(await userApi.inviteTokens());
  }

  useEffect(() => {
    void load();
  }, []);

  async function generate() {
    try {
      await userApi.createInviteToken();
      showToast('邀请码生成成功', 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '生成失败', 'error');
    }
  }

  return (
    <main className="page-stack">
      <section className="section">
        <div className="section-header">
          <h2>邀请码管理</h2>
          <button className="button primary" type="button" onClick={() => void generate()}>
            <Plus size={16} />
            生成新邀请码
          </button>
        </div>
        {!tokens ? (
          <LoadingState />
        ) : tokens.length === 0 ? (
          <EmptyState label="暂无邀请码" />
        ) : (
          <div className="token-grid">
            {tokens.map((token) => (
              <code key={token.id} className={token.used ? 'token used' : 'token'}>
                {token.token}
                <span>{token.used ? '已使用' : '未使用'}</span>
              </code>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
