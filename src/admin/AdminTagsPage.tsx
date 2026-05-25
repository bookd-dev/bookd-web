import { FormEvent, useEffect, useMemo, useState } from 'react';
import { GitMerge, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { tagApi } from '../api/bookdApi';
import type { TagWithStats } from '../api/types';
import { Modal } from '../components/Modal';
import { EmptyState, LoadingState } from '../components/States';
import { useConfirm } from '../components/ConfirmProvider';
import { useToast } from '../components/ToastProvider';

export function AdminTagsPage() {
  return (
    <main className="page-stack">
      <TagsManagementSection />
    </main>
  );
}

export function TagsManagementSection() {
  const [tags, setTags] = useState<TagWithStats[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const allSelected = useMemo(() => tags && tags.length > 0 && selected.size === tags.length, [selected.size, tags]);

  async function load() {
    setTags(await tagApi.list());
    setSelected(new Set());
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();
    if (!name) {
      showToast('请输入标签名称', 'error');
      return;
    }
    try {
      await tagApi.create(name);
      showToast('标签创建成功', 'success');
      setCreateOpen(false);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建失败', 'error');
    }
  }

  async function deleteTags(ids: number[]) {
    if (ids.length === 0) return;
    if (!(await confirm({ message: `确定要删除 ${ids.length} 个标签吗？`, danger: true }))) return;
    let failed = 0;
    for (const id of ids) {
      try {
        await tagApi.delete(id);
      } catch {
        failed += 1;
      }
    }
    showToast(failed ? `删除完成，失败 ${failed} 个` : '标签已删除', failed ? 'info' : 'success');
    await load();
  }

  async function autoTag() {
    if (!(await confirm({ message: '确定要自动提取所有书籍标签吗？' }))) return;
    try {
      const result = await tagApi.autoTagAll();
      showToast(`处理 ${result.totalBooks} 本，新增 ${result.tagsCreated} 个标签`, 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '自动提取失败', 'error');
    }
  }

  async function merge() {
    if (selected.size === 0 || !mergeTarget.trim()) {
      showToast('请选择源标签并输入目标标签', 'error');
      return;
    }
    try {
      await tagApi.merge(Array.from(selected), mergeTarget.trim());
      showToast('标签合并成功', 'success');
      setMergeOpen(false);
      setMergeTarget('');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '合并失败', 'error');
    }
  }

  return (
    <>
      <section className="section">
        <div className="section-header">
          <h2>标签管理</h2>
          <div className="toolbar">
            <button className="button secondary" type="button" onClick={() => void autoTag()}>
              <RefreshCw size={16} />
              自动提取
            </button>
            <button className="button secondary" type="button" onClick={() => setMergeOpen(true)}>
              <GitMerge size={16} />
              合并标签
            </button>
            <button className="button primary" type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              创建标签
            </button>
            {selected.size > 0 && (
              <button className="button danger" type="button" onClick={() => void deleteTags(Array.from(selected))}>
                <Trash2 size={16} />
                批量删除 {selected.size}
              </button>
            )}
          </div>
        </div>
        {!tags ? (
          <LoadingState />
        ) : tags.length === 0 ? (
          <EmptyState label="暂无标签" />
        ) : (
          <div className="list">
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(allSelected)}
                onChange={(event) => setSelected(event.target.checked ? new Set(tags.map((tag) => tag.id)) : new Set())}
              />
              全选
            </label>
            {tags.map((tag) => (
              <article key={tag.id} className="list-row">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={selected.has(tag.id)}
                    onChange={(event) => {
                      setSelected((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(tag.id);
                        else next.delete(tag.id);
                        return next;
                      });
                    }}
                  />
                  <strong>{tag.name}</strong>
                </label>
                <span>{tag.bookCount} 本书籍</span>
                <button className="button danger" type="button" onClick={() => void deleteTags([tag.id])}>
                  <Trash2 size={16} />
                  删除
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal open={createOpen} title="创建新标签" onClose={() => setCreateOpen(false)}>
        <form className="form" onSubmit={create}>
          <label>
            标签名称
            <input name="name" autoFocus />
          </label>
          <button className="button primary full" type="submit">创建</button>
        </form>
      </Modal>

      <Modal open={mergeOpen} title="合并标签" onClose={() => setMergeOpen(false)}>
        <div className="form">
          <p className="muted">使用列表中的复选框选择源标签，输入目标标签名称后合并。</p>
          <label>
            目标标签名称
            <input value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)} />
          </label>
          <button className="button primary full" type="button" onClick={() => void merge()}>
            合并标签
          </button>
        </div>
      </Modal>
    </>
  );
}
