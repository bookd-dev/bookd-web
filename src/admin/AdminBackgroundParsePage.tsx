import { useEffect, useState } from 'react';
import { Play, RefreshCw, Square } from 'lucide-react';
import { backgroundParseApi } from '../api/bookdApi';
import type { BackgroundParseStatus } from '../api/types';
import { useConfirm } from '../components/ConfirmProvider';
import { LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import { useI18n } from '../i18n';

export function AdminBackgroundParsePage() {
  const [status, setStatus] = useState<BackgroundParseStatus | null>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { t } = useI18n();

  async function refresh() {
    setStatus(await backgroundParseApi.status());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function start() {
    if (!(await confirm({ message: t('backgroundParse.startConfirm') }))) return;
    try {
      await backgroundParseApi.start();
      showToast(t('backgroundParse.started'), 'success');
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('backgroundParse.startFailed'), 'error');
    }
  }

  async function stop() {
    if (!(await confirm({ message: t('backgroundParse.stopConfirm'), danger: true }))) return;
    try {
      await backgroundParseApi.stop();
      showToast(t('backgroundParse.stopped'), 'success');
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('backgroundParse.stopFailed'), 'error');
    }
  }

  if (!status) return <LoadingState />;

  return (
    <main className="page-stack">
      <section className="section">
        <div className="section-header">
          <h2>{t('backgroundParse.title')}</h2>
          <button className="button secondary" type="button" onClick={() => void refresh()}>
            <RefreshCw size={16} />
            {t('common.refresh')}
          </button>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{!status.enabled ? t('backgroundParse.statusDisabled') : status.running ? t('backgroundParse.statusRunning') : t('backgroundParse.statusStopped')}</strong>
            <span>{t('backgroundParse.serviceStatus')}</span>
          </div>
          <div className="stat-card">
            <strong>{status.unparsedBooksCount}</strong>
            <span>{t('backgroundParse.pendingBooks')}</span>
          </div>
          <div className="stat-card">
            <strong>{t('common.seconds', { count: status.intervalSeconds })}</strong>
            <span>{t('backgroundParse.interval')}</span>
          </div>
          <div className="stat-card">
            <strong>{status.batchSize}</strong>
            <span>{t('backgroundParse.batchSize')}</span>
          </div>
        </div>
        <div className="toolbar">
          <button className="button primary" type="button" disabled={!status.enabled || status.running} onClick={() => void start()}>
            <Play size={16} />
            {t('backgroundParse.startService')}
          </button>
          <button className="button danger" type="button" disabled={!status.enabled || !status.running} onClick={() => void stop()}>
            <Square size={16} />
            {t('backgroundParse.stopService')}
          </button>
        </div>
      </section>
    </main>
  );
}
