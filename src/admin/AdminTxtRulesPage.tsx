import { FormEvent, useEffect, useState } from 'react';
import { Download, Edit2, Plus, Power, Trash2 } from 'lucide-react';
import { txtRuleApi } from '../api/bookdApi';
import type { TxtParseRule, TxtParseRuleRequest } from '../api/types';
import { useConfirm } from '../components/ConfirmProvider';
import { Modal } from '../components/Modal';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import { useI18n } from '../i18n';

const DEFAULT_RULES_JSON = `[
  {
    "name": "常规模式",
    "rule": "^[ 　\\\\t]{0,4}(?:序章|楔子|正文(?!完|结)|终章|后记|尾声|番外|第\\\\s{0,4}[\\\\d〇零一二两三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+?\\\\s{0,4}(?:章|节(?!课)|卷|集(?![合和])|部(?![分赛游])|篇(?!张))).{0,30}$",
    "example": "第一章 我还活着"
  },
  {
    "name": "英文章节",
    "rule": "^[ 　\\\\t]{0,4}(?:[Cc]hapter|[Ss]ection|[Pp]art|ＰＡＲＴ|[Nn][oO][.、]|[Ee]pisode)\\\\s{0,4}\\\\d{1,4}.{0,30}$",
    "example": "Chapter 1 The Beginning"
  },
  {
    "name": "纯数字标题",
    "rule": "(?<=[　\\\\s])\\\\d+\\\\.?[ 　\\\\t]{0,4}$",
    "example": "12"
  },
  {
    "name": "数字 分隔符 标题",
    "rule": "^[ 　\\\\t]{0,4}\\\\d{1,5}[:：,.， 、_—\\\\-].{1,30}$",
    "example": "1、这个就是标题"
  }
]`;

function formToRule(form: HTMLFormElement): TxtParseRuleRequest {
  const data = new FormData(form);
  return {
    name: String(data.get('name') ?? '').trim(),
    rule: String(data.get('rule') ?? '').trim(),
    example: String(data.get('example') ?? '').trim() || null,
    enabled: true,
    priority: Number(data.get('priority') ?? 0)
  };
}

export function AdminTxtRulesPage() {
  return (
    <main className="page-stack">
      <TxtRulesManagementSection />
    </main>
  );
}

export function TxtRulesManagementSection() {
  const [rules, setRules] = useState<TxtParseRule[] | null>(null);
  const [editing, setEditing] = useState<TxtParseRule | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { t } = useI18n();

  async function load() {
    setRules(await txtRuleApi.list());
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = formToRule(event.currentTarget);
    if (!request.name || !request.rule) {
      showToast(t('txtRules.missingRequired'), 'error');
      return;
    }
    try {
      await txtRuleApi.create(request);
      showToast(t('txtRules.created'), 'success');
      setAddOpen(false);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('txtRules.createFailed'), 'error');
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const request = formToRule(event.currentTarget);
    if (!request.name || !request.rule) {
      showToast(t('txtRules.missingRequired'), 'error');
      return;
    }
    try {
      await txtRuleApi.update(editing.id, request);
      showToast(t('txtRules.updated'), 'success');
      setEditing(null);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('txtRules.updateFailed'), 'error');
    }
  }

  async function deleteRule(rule: TxtParseRule) {
    if (!(await confirm({ message: t('txtRules.deleteConfirm', { name: rule.name }), danger: true }))) return;
    try {
      await txtRuleApi.delete(rule.id);
      showToast(t('txtRules.deleted'), 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('txtRules.deleteFailed'), 'error');
    }
  }

  async function toggleRule(rule: TxtParseRule) {
    try {
      await txtRuleApi.toggle(rule.id);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('common.operationFailed'), 'error');
    }
  }

  async function importRules() {
    if (!jsonContent.trim()) {
      showToast(t('txtRules.jsonRequired'), 'error');
      return;
    }
    try {
      JSON.parse(jsonContent);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('txtRules.jsonInvalid'), 'error');
      return;
    }
    try {
      const result = await txtRuleApi.importJson(jsonContent);
      showToast(t('txtRules.importDone', { imported: result.imported, skipped: result.skipped }), 'success');
      setImportOpen(false);
      setJsonContent('');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('txtRules.importFailed'), 'error');
    }
  }

  return (
    <>
      <section className="section">
        <div className="section-header">
          <h2>{t('txtRules.title')}</h2>
          <div className="toolbar">
            <button className="button secondary" type="button" onClick={() => setImportOpen(true)}>
              <Download size={16} />
              {t('txtRules.jsonImport')}
            </button>
            <button className="button primary" type="button" onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              {t('txtRules.addRule')}
            </button>
          </div>
        </div>
        {!rules ? (
          <LoadingState />
        ) : rules.length === 0 ? (
          <EmptyState label={t('txtRules.empty')} />
        ) : (
          <div className="list">
            {rules.map((rule) => (
              <article key={rule.id} className={rule.enabled ? 'list-row' : 'list-row disabled-row'}>
                <div className="rule-main">
                  <strong>{rule.name}</strong>
                  <code>{rule.rule}</code>
                  {rule.example && <span>{t('txtRules.example', { example: rule.example })}</span>}
                </div>
                <span className="pill">{t('txtRules.priority', { priority: rule.priority })}</span>
                <div className="row-actions">
                  <button className="button secondary" type="button" onClick={() => void toggleRule(rule)}>
                    <Power size={16} />
                    {rule.enabled ? t('common.disable') : t('common.enable')}
                  </button>
                  <button className="button secondary" type="button" onClick={() => setEditing(rule)}>
                    <Edit2 size={16} />
                    {t('common.edit')}
                  </button>
                  <button className="button danger" type="button" onClick={() => void deleteRule(rule)}>
                    <Trash2 size={16} />
                    {t('common.delete')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal open={addOpen} title={t('txtRules.addTitle')} onClose={() => setAddOpen(false)} wide>
        <TxtRuleForm onSubmit={saveNew} />
      </Modal>

      <Modal open={Boolean(editing)} title={t('txtRules.editTitle')} onClose={() => setEditing(null)} wide>
        {editing && <TxtRuleForm initial={editing} onSubmit={saveEdit} />}
      </Modal>

      <Modal open={importOpen} title={t('txtRules.importTitle')} onClose={() => setImportOpen(false)} wide>
        <div className="form">
          <label>
            {t('txtRules.jsonContent')}
            <textarea rows={14} value={jsonContent} onChange={(event) => setJsonContent(event.target.value)} />
          </label>
          <div className="dialog-actions">
            <button className="button secondary" type="button" onClick={() => setJsonContent(DEFAULT_RULES_JSON)}>
              {t('txtRules.loadDefaults')}
            </button>
            <button className="button primary" type="button" onClick={() => void importRules()}>
              {t('txtRules.import')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function TxtRuleForm({ initial, onSubmit }: { initial?: TxtParseRule; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const { t } = useI18n();

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        {t('txtRules.name')}
        <input name="name" defaultValue={initial?.name ?? ''} autoFocus />
      </label>
      <label>
        {t('txtRules.regex')}
        <textarea name="rule" rows={5} defaultValue={initial?.rule ?? ''} />
      </label>
      <label>
        {t('txtRules.exampleLabel')}
        <input name="example" defaultValue={initial?.example ?? ''} />
      </label>
      <label>
        {t('txtRules.priorityLabel')}
        <input name="priority" type="number" min={0} max={100} defaultValue={initial?.priority ?? 0} />
      </label>
      <button className="button primary full" type="submit">{t('common.save')}</button>
    </form>
  );
}
