import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { userApi } from '../api/bookdApi';
import type { InviteToken } from '../api/types';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import { useI18n } from '../i18n';

export function AdminInviteTokensPage() {
  const [tokens, setTokens] = useState<InviteToken[] | null>(null);
  const { showToast } = useToast();
  const { t } = useI18n();

  async function load() {
    setTokens(await userApi.inviteTokens());
  }

  useEffect(() => {
    void load();
  }, []);

  async function generate() {
    try {
      await userApi.createInviteToken();
      showToast(t('inviteTokens.generated'), 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('inviteTokens.generateFailed'), 'error');
    }
  }

  return (
    <main className="page-stack">
      <section className="section">
        <div className="section-header">
          <h2>{t('inviteTokens.title')}</h2>
          <button className="button primary" type="button" onClick={() => void generate()}>
            <Plus size={16} />
            {t('inviteTokens.generate')}
          </button>
        </div>
        {!tokens ? (
          <LoadingState />
        ) : tokens.length === 0 ? (
          <EmptyState label={t('inviteTokens.empty')} />
        ) : (
          <div className="token-grid">
            {tokens.map((token) => (
              <code key={token.id} className={token.used ? 'token used' : 'token'}>
                {token.token}
                <span>{token.used ? t('inviteTokens.used') : t('inviteTokens.unused')}</span>
              </code>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
