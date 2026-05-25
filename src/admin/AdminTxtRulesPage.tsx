import { FormEvent, useEffect, useState } from 'react';
import { Download, Edit2, Plus, Power, Trash2 } from 'lucide-react';
import { txtRuleApi } from '../api/bookdApi';
import type { TxtParseRule, TxtParseRuleRequest } from '../api/types';
import { useConfirm } from '../components/ConfirmProvider';
import { Modal } from '../components/Modal';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';

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
      showToast('请填写规则名称和正则表达式', 'error');
      return;
    }
    try {
      await txtRuleApi.create(request);
      showToast('规则创建成功', 'success');
      setAddOpen(false);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建失败', 'error');
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const request = formToRule(event.currentTarget);
    if (!request.name || !request.rule) {
      showToast('请填写规则名称和正则表达式', 'error');
      return;
    }
    try {
      await txtRuleApi.update(editing.id, request);
      showToast('规则更新成功', 'success');
      setEditing(null);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '更新失败', 'error');
    }
  }

  async function deleteRule(rule: TxtParseRule) {
    if (!(await confirm({ message: `确定要删除规则 "${rule.name}" 吗？`, danger: true }))) return;
    try {
      await txtRuleApi.delete(rule.id);
      showToast('规则已删除', 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    }
  }

  async function toggleRule(rule: TxtParseRule) {
    try {
      await txtRuleApi.toggle(rule.id);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败', 'error');
    }
  }

  async function importRules() {
    if (!jsonContent.trim()) {
      showToast('请输入 JSON 内容', 'error');
      return;
    }
    try {
      JSON.parse(jsonContent);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'JSON 格式错误', 'error');
      return;
    }
    try {
      const result = await txtRuleApi.importJson(jsonContent);
      showToast(`导入 ${result.imported} 条，跳过 ${result.skipped} 条`, 'success');
      setImportOpen(false);
      setJsonContent('');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '导入失败', 'error');
    }
  }

  return (
    <>
      <section className="section">
        <div className="section-header">
          <h2>TXT 解析规则</h2>
          <div className="toolbar">
            <button className="button secondary" type="button" onClick={() => setImportOpen(true)}>
              <Download size={16} />
              JSON 导入
            </button>
            <button className="button primary" type="button" onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              添加规则
            </button>
          </div>
        </div>
        {!rules ? (
          <LoadingState />
        ) : rules.length === 0 ? (
          <EmptyState label="暂无解析规则" />
        ) : (
          <div className="list">
            {rules.map((rule) => (
              <article key={rule.id} className={rule.enabled ? 'list-row' : 'list-row disabled-row'}>
                <div className="rule-main">
                  <strong>{rule.name}</strong>
                  <code>{rule.rule}</code>
                  {rule.example && <span>示例：{rule.example}</span>}
                </div>
                <span className="pill">优先级 {rule.priority}</span>
                <div className="row-actions">
                  <button className="button secondary" type="button" onClick={() => void toggleRule(rule)}>
                    <Power size={16} />
                    {rule.enabled ? '禁用' : '启用'}
                  </button>
                  <button className="button secondary" type="button" onClick={() => setEditing(rule)}>
                    <Edit2 size={16} />
                    编辑
                  </button>
                  <button className="button danger" type="button" onClick={() => void deleteRule(rule)}>
                    <Trash2 size={16} />
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal open={addOpen} title="添加 TXT 解析规则" onClose={() => setAddOpen(false)} wide>
        <TxtRuleForm onSubmit={saveNew} />
      </Modal>

      <Modal open={Boolean(editing)} title="编辑 TXT 解析规则" onClose={() => setEditing(null)} wide>
        {editing && <TxtRuleForm initial={editing} onSubmit={saveEdit} />}
      </Modal>

      <Modal open={importOpen} title="导入 TXT 解析规则" onClose={() => setImportOpen(false)} wide>
        <div className="form">
          <label>
            JSON 内容
            <textarea rows={14} value={jsonContent} onChange={(event) => setJsonContent(event.target.value)} />
          </label>
          <div className="dialog-actions">
            <button className="button secondary" type="button" onClick={() => setJsonContent(DEFAULT_RULES_JSON)}>
              加载默认规则
            </button>
            <button className="button primary" type="button" onClick={() => void importRules()}>
              导入
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function TxtRuleForm({ initial, onSubmit }: { initial?: TxtParseRule; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        规则名称
        <input name="name" defaultValue={initial?.name ?? ''} autoFocus />
      </label>
      <label>
        正则表达式
        <textarea name="rule" rows={5} defaultValue={initial?.rule ?? ''} />
      </label>
      <label>
        示例
        <input name="example" defaultValue={initial?.example ?? ''} />
      </label>
      <label>
        优先级
        <input name="priority" type="number" min={0} max={100} defaultValue={initial?.priority ?? 0} />
      </label>
      <button className="button primary full" type="submit">保存</button>
    </form>
  );
}
