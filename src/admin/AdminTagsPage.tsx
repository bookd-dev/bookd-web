import { FormEvent, useEffect, useMemo, useState } from 'react';
import { GitMerge, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { tagApi } from '../api/bookdApi';
import type { TagWithStats } from '../api/types';
import { Modal } from '../components/Modal';
import { EmptyState, LoadingState } from '../components/States';
import { useConfirm } from '../components/ConfirmProvider';
import { useToast } from '../components/ToastProvider';
import { useI18n } from '../i18n';

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
  const { t } = useI18n();

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
      showToast(t('tags.missingName'), 'error');
      return;
    }
    try {
      await tagApi.create(name);
      showToast(t('tags.created'), 'success');
      setCreateOpen(false);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('tags.createFailed'), 'error');
    }
  }

  async function deleteTags(ids: number[]) {
    if (ids.length === 0) return;
    if (!(await confirm({ message: t('tags.deleteConfirm', { count: ids.length }), danger: true }))) return;
    let failed = 0;
    for (const id of ids) {
      try {
        await tagApi.delete(id);
      } catch {
        failed += 1;
      }
    }
    showToast(failed ? t('tags.deletePartial', { count: failed }) : t('tags.deleted'), failed ? 'info' : 'success');
    await load();
  }

  async function autoTag() {
    if (!(await confirm({ message: t('tags.autoTagConfirm') }))) return;
    try {
      const result = await tagApi.autoTagAll();
      showToast(t('tags.autoTagDone', { books: result.totalBooks, tags: result.tagsCreated }), 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('tags.autoTagFailed'), 'error');
    }
  }

  async function merge() {
    if (selected.size === 0 || !mergeTarget.trim()) {
      showToast(t('tags.mergeMissing'), 'error');
      return;
    }
    try {
      await tagApi.merge(Array.from(selected), mergeTarget.trim());
      showToast(t('tags.merged'), 'success');
      setMergeOpen(false);
      setMergeTarget('');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('tags.mergeFailed'), 'error');
    }
  }

  return (
    <>
      <section className="section">
        <div className="section-header">
          <h2>{t('tags.title')}</h2>
          <div className="toolbar">
            <button className="button secondary" type="button" onClick={() => void autoTag()}>
              <RefreshCw size={16} />
              {t('tags.autoExtract')}
            </button>
            <button className="button secondary" type="button" onClick={() => setMergeOpen(true)}>
              <GitMerge size={16} />
              {t('tags.merge')}
            </button>
            <button className="button primary" type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              {t('tags.create')}
            </button>
            {selected.size > 0 && (
              <button className="button danger" type="button" onClick={() => void deleteTags(Array.from(selected))}>
                <Trash2 size={16} />
                {t('tags.batchDelete', { count: selected.size })}
              </button>
            )}
          </div>
        </div>
        {!tags ? (
          <LoadingState />
        ) : tags.length === 0 ? (
          <EmptyState label={t('tags.empty')} />
        ) : (
          <div className="list">
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(allSelected)}
                onChange={(event) => setSelected(event.target.checked ? new Set(tags.map((tag) => tag.id)) : new Set())}
              />
              {t('tags.selectAll')}
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
                <span>{t('common.booksCount', { count: tag.bookCount })}</span>
                <button className="button danger" type="button" onClick={() => void deleteTags([tag.id])}>
                  <Trash2 size={16} />
                  {t('common.delete')}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal open={createOpen} title={t('tags.createTitle')} onClose={() => setCreateOpen(false)}>
        <form className="form" onSubmit={create}>
          <label>
            {t('tags.name')}
            <input name="name" autoFocus />
          </label>
          <button className="button primary full" type="submit">{t('common.create')}</button>
        </form>
      </Modal>

      <Modal open={mergeOpen} title={t('tags.merge')} onClose={() => setMergeOpen(false)}>
        <div className="form">
          <p className="muted">{t('tags.mergeHelp')}</p>
          <label>
            {t('tags.targetName')}
            <input value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)} />
          </label>
          <button className="button primary full" type="button" onClick={() => void merge()}>
            {t('tags.merge')}
          </button>
        </div>
      </Modal>
    </>
  );
}
