import { useEffect, useState } from 'react';
import { Play, RefreshCw, Square } from 'lucide-react';
import { backgroundParseApi } from '../api/bookdApi';
import type { BackgroundParseStatus } from '../api/types';
import { useConfirm } from '../components/ConfirmProvider';
import { LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';

export function AdminBackgroundParsePage() {
  const [status, setStatus] = useState<BackgroundParseStatus | null>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  async function refresh() {
    setStatus(await backgroundParseApi.status());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function start() {
    if (!(await confirm({ message: '确定要启动后台解析服务吗？' }))) return;
    try {
      await backgroundParseApi.start();
      showToast('后台解析服务已启动', 'success');
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '启动失败', 'error');
    }
  }

  async function stop() {
    if (!(await confirm({ message: '确定要停止后台解析服务吗？正在进行的任务会被取消。', danger: true }))) return;
    try {
      await backgroundParseApi.stop();
      showToast('后台解析服务已停止', 'success');
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '停止失败', 'error');
    }
  }

  if (!status) return <LoadingState />;

  return (
    <main className="page-stack">
      <section className="section">
        <div className="section-header">
          <h2>后台章节解析</h2>
          <button className="button secondary" type="button" onClick={() => void refresh()}>
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{!status.enabled ? '未启用' : status.running ? '运行中' : '已停止'}</strong>
            <span>服务状态</span>
          </div>
          <div className="stat-card">
            <strong>{status.unparsedBooksCount}</strong>
            <span>待解析书籍</span>
          </div>
          <div className="stat-card">
            <strong>{status.intervalSeconds} 秒</strong>
            <span>解析间隔</span>
          </div>
          <div className="stat-card">
            <strong>{status.batchSize}</strong>
            <span>批次大小</span>
          </div>
        </div>
        <div className="toolbar">
          <button className="button primary" type="button" disabled={!status.enabled || status.running} onClick={() => void start()}>
            <Play size={16} />
            启动服务
          </button>
          <button className="button danger" type="button" disabled={!status.enabled || !status.running} onClick={() => void stop()}>
            <Square size={16} />
            停止服务
          </button>
        </div>
      </section>
    </main>
  );
}
