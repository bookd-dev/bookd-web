import { FormEvent, useEffect, useState } from 'react';
import { Bot, Boxes, Cpu, Edit2, Plus, Save, SlidersHorizontal, Trash2 } from 'lucide-react';
import { aiEndpointApi, aiModelApi, aiProviderApi, personalizationApi } from '../api/bookdApi';
import type {
  AiEndpoint,
  AiEndpointRequest,
  AiModel,
  AiModelRequest,
  AiProvider,
  AiProviderRequest,
  PersonalizationOverview
} from '../api/types';
import { useConfirm } from '../components/ConfirmProvider';
import { Modal } from '../components/Modal';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import { useI18n } from '../i18n';

type ProviderEditor = { provider?: AiProvider } | null;
type PersonalizationTab = 'system' | 'ai';

function formCapabilities(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    supportsTts: data.get('supportsTts') === 'on',
    supportsLlm: data.get('supportsLlm') === 'on'
  };
}

function providerFromForm(form: HTMLFormElement): AiProviderRequest {
  const data = new FormData(form);
  return {
    name: String(data.get('name') ?? '').trim(),
    providerKind: String(data.get('providerKind') ?? '').trim(),
    enabled: data.get('enabled') === 'on',
    priority: Number(data.get('priority') ?? 0)
  };
}

function endpointFromForm(form: HTMLFormElement): AiEndpointRequest {
  const data = new FormData(form);
  const apiKey = String(data.get('apiKey') ?? '').trim();
  return {
    baseUrl: String(data.get('baseUrl') ?? '').trim(),
    apiKey: apiKey || null,
    maxConcurrency: Number(data.get('maxConcurrency') ?? 1),
    enabled: data.get('enabled') === 'on',
    priority: Number(data.get('priority') ?? 0)
  };
}

function modelFromForm(form: HTMLFormElement): AiModelRequest {
  const data = new FormData(form);
  const capabilities = formCapabilities(form);
  return {
    modelName: String(data.get('modelName') ?? '').trim(),
    displayName: String(data.get('displayName') ?? '').trim(),
    supportsTts: capabilities.supportsTts,
    supportsLlm: capabilities.supportsLlm,
    enabled: data.get('enabled') === 'on',
    priority: Number(data.get('priority') ?? 0)
  };
}

function providerEndpoints(provider: AiProvider): AiEndpoint[] {
  return provider.endpoints ?? [];
}

function endpointModels(endpoint: AiEndpoint): AiModel[] {
  return endpoint.models ?? [];
}

function providerToRequest(provider: AiProvider, enabled = provider.enabled): AiProviderRequest {
  return {
    name: provider.name,
    providerKind: provider.providerKind,
    enabled,
    priority: provider.priority
  };
}

export function AdminPersonalizationPage() {
  const [overview, setOverview] = useState<PersonalizationOverview | null>(null);
  const [timeZone, setTimeZone] = useState('');
  const [activeTab, setActiveTab] = useState<PersonalizationTab>('system');
  const [providerEditor, setProviderEditor] = useState<ProviderEditor>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { t } = useI18n();

  async function load() {
    const result = await personalizationApi.overview();
    setOverview(result);
    setTimeZone(result.settings.timeZone);
    return result;
  }

  async function refreshProviderEditor(providerId: number) {
    const result = await load();
    const provider = result.providers.find((candidate) => candidate.id === providerId);
    setProviderEditor(provider ? { provider } : null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveTimeZone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!timeZone.trim()) {
      showToast(t('personalization.timeZoneRequired'), 'error');
      return;
    }
    try {
      const settings = await personalizationApi.updateTimeZone(timeZone.trim());
      setOverview((current) => current ? { ...current, settings } : current);
      setTimeZone(settings.timeZone);
      showToast(t('personalization.timeZoneSaved'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('personalization.timeZoneSaveFailed'), 'error');
    }
  }

  async function saveProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = providerFromForm(event.currentTarget);
    if (!request.name || !request.providerKind) {
      showToast(t('personalization.providerRequired'), 'error');
      return false;
    }
    try {
      let saved: AiProvider;
      if (providerEditor?.provider) {
        saved = await aiProviderApi.update(providerEditor.provider.id, request);
      } else {
        saved = await aiProviderApi.create(request);
      }
      showToast(t('personalization.providerSaved'), 'success');
      const result = await load();
      const provider = result.providers.find((candidate) => candidate.id === saved.id) ?? saved;
      setProviderEditor({ provider });
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('personalization.providerSaveFailed'), 'error');
      return false;
    }
  }

  async function deleteProvider(provider: AiProvider) {
    if (!(await confirm({ message: t('personalization.deleteProviderConfirm', { name: provider.name }), danger: true }))) return false;
    try {
      await aiProviderApi.delete(provider.id);
      showToast(t('personalization.providerDeleted'), 'success');
      setProviderEditor(null);
      await load();
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('personalization.deleteFailed'), 'error');
      return false;
    }
  }

  async function toggleProviderEnabled(provider: AiProvider) {
    try {
      await aiProviderApi.update(provider.id, providerToRequest(provider, !provider.enabled));
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('personalization.providerSaveFailed'), 'error');
    }
  }

  async function saveEndpoint(event: FormEvent<HTMLFormElement>, providerId: number, endpoint?: AiEndpoint) {
    event.preventDefault();
    const request = endpointFromForm(event.currentTarget);
    if (!request.baseUrl || request.maxConcurrency < 1) {
      showToast(t('personalization.endpointRequired'), 'error');
      return false;
    }
    try {
      if (endpoint) {
        await aiEndpointApi.update(endpoint.id, request);
      } else {
        await aiProviderApi.createEndpoint(providerId, request);
      }
      showToast(t('personalization.endpointSaved'), 'success');
      await refreshProviderEditor(providerId);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('personalization.endpointSaveFailed'), 'error');
      return false;
    }
  }

  async function deleteEndpoint(endpoint: AiEndpoint, providerId: number) {
    if (!(await confirm({ message: t('personalization.deleteEndpointConfirm', { url: endpoint.baseUrl }), danger: true }))) return false;
    try {
      await aiEndpointApi.delete(endpoint.id);
      showToast(t('personalization.endpointDeleted'), 'success');
      await refreshProviderEditor(providerId);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('personalization.deleteFailed'), 'error');
      return false;
    }
  }

  async function saveModel(event: FormEvent<HTMLFormElement>, providerId: number, endpointId: number, model?: AiModel) {
    event.preventDefault();
    const request = modelFromForm(event.currentTarget);
    if (!request.modelName || !request.displayName) {
      showToast(t('personalization.modelRequired'), 'error');
      return false;
    }
    if (!request.supportsTts && !request.supportsLlm) {
      showToast(t('personalization.capabilityRequired'), 'error');
      return false;
    }
    try {
      if (model) {
        await aiModelApi.update(model.id, request);
      } else {
        await aiEndpointApi.createModel(endpointId, request);
      }
      showToast(t('personalization.modelSaved'), 'success');
      await refreshProviderEditor(providerId);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('personalization.modelSaveFailed'), 'error');
      return false;
    }
  }

  async function deleteModel(model: AiModel, providerId: number) {
    if (!(await confirm({ message: t('personalization.deleteModelConfirm', { name: model.displayName }), danger: true }))) return false;
    try {
      await aiModelApi.delete(model.id);
      showToast(t('personalization.modelDeleted'), 'success');
      await refreshProviderEditor(providerId);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('personalization.deleteFailed'), 'error');
      return false;
    }
  }

  if (!overview) return <LoadingState />;
  const providers = overview.providers ?? [];

  return (
    <main className="page-stack" data-testid="personalization-page">
      <div className="subtab-bar" role="tablist" aria-label={t('personalization.tabsLabel')}>
        <button
          id="personalization-system-tab"
          className={activeTab === 'system' ? 'subtab active' : 'subtab'}
          type="button"
          role="tab"
          aria-selected={activeTab === 'system'}
          aria-controls="personalization-system-panel"
          onClick={() => setActiveTab('system')}
        >
          <SlidersHorizontal size={16} />
          {t('personalization.systemPreferences')}
        </button>
        <button
          id="personalization-ai-tab"
          className={activeTab === 'ai' ? 'subtab active' : 'subtab'}
          type="button"
          role="tab"
          aria-selected={activeTab === 'ai'}
          aria-controls="personalization-ai-panel"
          onClick={() => setActiveTab('ai')}
        >
          <Bot size={16} />
          {t('personalization.aiServices')}
        </button>
      </div>

      {activeTab === 'system' ? (
        <section
          id="personalization-system-panel"
          className="section"
          role="tabpanel"
          aria-labelledby="personalization-system-tab"
        >
          <div className="section-header">
            <div>
              <h2>{t('personalization.systemPreferences')}</h2>
            </div>
          </div>
          <form className="inline-form compact-form" onSubmit={saveTimeZone}>
            <label className="grow">
              {t('personalization.timeZone')}
              <input value={timeZone} onChange={(event) => setTimeZone(event.target.value)} placeholder={t('personalization.timeZonePlaceholder')} />
            </label>
            <button className="button primary" type="submit">
              <Save size={16} />
              {t('common.save')}
            </button>
          </form>
        </section>
      ) : (
        <section
          id="personalization-ai-panel"
          className="section"
          role="tabpanel"
          aria-labelledby="personalization-ai-tab"
        >
          <div className="section-header">
            <div>
              <h2>{t('personalization.aiServices')}</h2>
            </div>
            <button className="button primary" type="button" onClick={() => setProviderEditor({})}>
              <Plus size={16} />
              {t('personalization.addProvider')}
            </button>
          </div>
          {providers.length === 0 ? (
            <EmptyState label={t('personalization.noProviders')} />
          ) : (
            <div className="list" data-testid="ai-provider-list">
              {providers.map((provider) => {
                const endpoints = providerEndpoints(provider);
                return (
                  <article key={provider.id} className={provider.enabled ? 'ai-provider-row' : 'ai-provider-row disabled-row'}>
                    <div className="ai-row-header">
                      <Cpu size={18} />
                      <div className="grow ai-row-text">
                        <strong className="ai-row-title">{provider.name}</strong>
                        <span className="ai-row-meta">{providerKindText(provider.providerKind, t)} · {t('personalization.priorityValue', { priority: provider.priority })}</span>
                      </div>
                      <div className="provider-row-actions">
                        <SwitchField
                          label={provider.enabled ? t('common.enabled') : t('common.disabled')}
                          checked={provider.enabled}
                          onChange={() => void toggleProviderEnabled(provider)}
                        />
                        <button className="button secondary" type="button" onClick={() => setProviderEditor({ provider })}>
                          <Edit2 size={16} />
                          {t('common.edit')}
                        </button>
                      </div>
                    </div>
                    <div className="ai-endpoint-list">
                      {endpoints.length === 0 ? (
                        <EmptyState label={t('personalization.noEndpoints')} />
                      ) : (
                        endpoints.map((endpoint) => (
                          <EndpointRow
                            key={endpoint.id}
                            endpoint={endpoint}
                          />
                        ))
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <Modal
        open={Boolean(providerEditor)}
        title={providerEditor?.provider ? t('personalization.editProvider') : t('personalization.addProvider')}
        onClose={() => setProviderEditor(null)}
        wide
      >
        <ProviderEditorContent
          provider={providerEditor?.provider}
          onSaveProvider={saveProvider}
          onDeleteProvider={deleteProvider}
          onSaveEndpoint={saveEndpoint}
          onDeleteEndpoint={deleteEndpoint}
          onSaveModel={saveModel}
          onDeleteModel={deleteModel}
        />
      </Modal>
    </main>
  );
}

function EndpointRow({
  endpoint
}: {
  endpoint: AiEndpoint;
}) {
  const { t } = useI18n();
  const models = endpointModels(endpoint);

  return (
    <article className={endpoint.enabled ? 'ai-endpoint-row' : 'ai-endpoint-row disabled-row'}>
      <div className="rule-main">
        <strong className="ai-row-title">{endpoint.baseUrl}</strong>
        <span className="ai-row-meta">
          {t('personalization.concurrencyValue', { count: endpoint.maxConcurrency })} · {t('personalization.priorityValue', { priority: endpoint.priority })} · {endpoint.apiKeySet ? t('personalization.apiKeyConfigured') : t('personalization.apiKeyMissing')}
        </span>
        <div className="ai-model-list">
          {models.length === 0 ? (
            <EmptyState label={t('personalization.noModels')} />
          ) : (
            models.map((model) => (
              <div key={model.id} className={model.enabled ? 'ai-model-row' : 'ai-model-row disabled-row'}>
                <Boxes size={16} />
                <div className="grow ai-row-text">
                  <strong className="ai-row-title">{model.displayName}</strong>
                  <span className="ai-row-meta">
                    {model.modelName} · {t('personalization.priorityValue', { priority: model.priority })} · {modelCapabilityText(model, t)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

function ProviderEditorContent({
  provider,
  onSaveProvider,
  onDeleteProvider,
  onSaveEndpoint,
  onDeleteEndpoint,
  onSaveModel,
  onDeleteModel
}: {
  provider?: AiProvider;
  onSaveProvider: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onDeleteProvider: (provider: AiProvider) => Promise<boolean>;
  onSaveEndpoint: (event: FormEvent<HTMLFormElement>, providerId: number, endpoint?: AiEndpoint) => Promise<boolean>;
  onDeleteEndpoint: (endpoint: AiEndpoint, providerId: number) => Promise<boolean>;
  onSaveModel: (event: FormEvent<HTMLFormElement>, providerId: number, endpointId: number, model?: AiModel) => Promise<boolean>;
  onDeleteModel: (model: AiModel, providerId: number) => Promise<boolean>;
}) {
  const [addingEndpoint, setAddingEndpoint] = useState(false);
  const [addingModelEndpointIds, setAddingModelEndpointIds] = useState<number[]>([]);
  const { t } = useI18n();
  const endpoints = provider ? providerEndpoints(provider) : [];

  useEffect(() => {
    setAddingEndpoint(false);
    setAddingModelEndpointIds([]);
  }, [provider?.id]);

  function isAddingModel(endpointId: number) {
    return addingModelEndpointIds.includes(endpointId);
  }

  function setAddingModel(endpointId: number, adding: boolean) {
    setAddingModelEndpointIds((current) => {
      if (adding) return current.includes(endpointId) ? current : [...current, endpointId];
      return current.filter((id) => id !== endpointId);
    });
  }

  return (
    <div className="provider-editor">
      <section className="editor-section">
        <div className="editor-section-header">
          <h3>{t('personalization.providerSettings')}</h3>
          {provider ? (
            <button className="button danger" type="button" onClick={() => void onDeleteProvider(provider)}>
              <Trash2 size={16} />
              {t('common.delete')}
            </button>
          ) : null}
        </div>
        <ProviderForm initial={provider} onSubmit={onSaveProvider} />
      </section>

      {provider ? (
        <>
          <section className="editor-section">
            <div className="editor-section-header">
              <h3>{t('personalization.endpointSettings')}</h3>
              <button className="button secondary" type="button" disabled={addingEndpoint} onClick={() => setAddingEndpoint(true)}>
                <Plus size={16} />
                {t('personalization.addEndpoint')}
              </button>
            </div>
            {addingEndpoint ? (
              <div className="editor-item">
                <EndpointForm
                  autoFocus
                  onSubmit={async (event) => {
                    if (await onSaveEndpoint(event, provider.id)) {
                      setAddingEndpoint(false);
                      return true;
                    }
                    return false;
                  }}
                />
              </div>
            ) : null}
            {endpoints.length === 0 && !addingEndpoint ? (
              <EmptyState label={t('personalization.noEndpoints')} />
            ) : (
              <div className="editor-list">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="editor-item">
                    <div className="editor-item-header">
                      <div className="ai-row-text">
                        <strong className="ai-row-title">{endpoint.baseUrl}</strong>
                        <span className="ai-row-meta">
                          {t('personalization.concurrencyValue', { count: endpoint.maxConcurrency })} · {t('personalization.priorityValue', { priority: endpoint.priority })} · {endpoint.apiKeySet ? t('personalization.apiKeyConfigured') : t('personalization.apiKeyMissing')}
                        </span>
                      </div>
                      <button className="button danger" type="button" onClick={() => void onDeleteEndpoint(endpoint, provider.id)}>
                        <Trash2 size={16} />
                        {t('common.delete')}
                      </button>
                    </div>
                    <EndpointForm initial={endpoint} onSubmit={(event) => onSaveEndpoint(event, provider.id, endpoint)} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="editor-section">
            <div className="editor-section-header">
              <h3>{t('personalization.modelSettings')}</h3>
            </div>
            {endpoints.length === 0 ? (
              <EmptyState label={t('personalization.noEndpoints')} />
            ) : (
              <div className="editor-list">
                {endpoints.map((endpoint) => {
                  const models = endpointModels(endpoint);
                  const addingModel = isAddingModel(endpoint.id);
                  return (
                    <div key={endpoint.id} className="editor-item">
                      <div className="editor-item-header">
                        <div className="ai-row-text">
                          <strong className="ai-row-title">{endpoint.baseUrl}</strong>
                          <span className="ai-row-meta">
                            {t('personalization.concurrencyValue', { count: endpoint.maxConcurrency })} · {t('personalization.priorityValue', { priority: endpoint.priority })}
                          </span>
                        </div>
                        <button
                          className="button secondary"
                          type="button"
                          disabled={addingModel}
                          onClick={() => setAddingModel(endpoint.id, true)}
                        >
                          <Plus size={16} />
                          {t('personalization.addModel')}
                        </button>
                      </div>

                      {addingModel ? (
                        <div className="editor-nested-item">
                          <ModelForm
                            autoFocus
                            onSubmit={async (event) => {
                              if (await onSaveModel(event, provider.id, endpoint.id)) {
                                setAddingModel(endpoint.id, false);
                                return true;
                              }
                              return false;
                            }}
                          />
                        </div>
                      ) : null}

                      {models.length === 0 && !addingModel ? (
                        <EmptyState label={t('personalization.noModels')} />
                      ) : (
                        <div className="editor-list compact">
                          {models.map((model) => (
                            <div key={model.id} className="editor-nested-item">
                              <div className="editor-item-header">
                                <div className="ai-row-text">
                                  <strong className="ai-row-title">{model.displayName}</strong>
                                  <span className="ai-row-meta">
                                    {model.modelName} · {t('personalization.priorityValue', { priority: model.priority })} · {modelCapabilityText(model, t)}
                                  </span>
                                </div>
                                <button className="button danger" type="button" onClick={() => void onDeleteModel(model, provider.id)}>
                                  <Trash2 size={16} />
                                  {t('common.delete')}
                                </button>
                              </div>
                              <ModelForm initial={model} onSubmit={(event) => onSaveModel(event, provider.id, endpoint.id, model)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function modelCapabilityText(model: AiModel, t: ReturnType<typeof useI18n>['t']) {
  return [
    model.supportsTts ? t('personalization.capabilityTts') : null,
    model.supportsLlm ? t('personalization.capabilityLlm') : null
  ].filter(Boolean).join(' · ');
}

function ProviderForm({
  initial,
  onSubmit
}: {
  initial?: AiProvider;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<boolean>;
}) {
  const { t } = useI18n();
  return (
    <form className="form" onSubmit={(event) => { void onSubmit(event); }}>
      <label>
        {t('personalization.providerName')}
        <input name="name" defaultValue={initial?.name ?? ''} autoFocus />
      </label>
      <label>
        {t('personalization.providerKind')}
        <select name="providerKind" defaultValue={initial?.providerKind ?? 'openai_compatible'}>
          <option value="openai_compatible">{t('personalization.providerKindOpenAiCompatible')}</option>
          <option value="custom">{t('personalization.providerKindCustom')}</option>
        </select>
      </label>
      <StateAndPriority enabled={initial?.enabled ?? true} priority={initial?.priority ?? 0} />
      <button className="button primary full" type="submit">{t('common.save')}</button>
    </form>
  );
}

function EndpointForm({
  initial,
  onSubmit,
  autoFocus = false
}: {
  initial?: AiEndpoint;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<boolean>;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  return (
    <form className="form" onSubmit={(event) => { void onSubmit(event); }}>
      <label>
        {t('personalization.baseUrl')}
        <input name="baseUrl" defaultValue={initial?.baseUrl ?? ''} placeholder={t('personalization.baseUrlPlaceholder')} autoFocus={autoFocus} />
      </label>
      <label>
        {t('personalization.apiKey')}
        <input
          name="apiKey"
          type="password"
          placeholder={initial?.apiKeySet ? t('personalization.apiKeyPreservePlaceholder') : t('personalization.apiKeyPlaceholder')}
        />
      </label>
      <label>
        {t('personalization.maxConcurrency')}
        <input name="maxConcurrency" type="number" min={1} defaultValue={initial?.maxConcurrency ?? 1} />
      </label>
      <StateAndPriority enabled={initial?.enabled ?? true} priority={initial?.priority ?? 0} />
      <button className="button primary full" type="submit">{t('common.save')}</button>
    </form>
  );
}

function ModelForm({
  initial,
  onSubmit,
  autoFocus = false
}: {
  initial?: AiModel;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<boolean>;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  return (
    <form className="form" onSubmit={(event) => { void onSubmit(event); }}>
      <label>
        {t('personalization.modelName')}
        <input name="modelName" defaultValue={initial?.modelName ?? ''} autoFocus={autoFocus} />
      </label>
      <label>
        {t('personalization.displayName')}
        <input name="displayName" defaultValue={initial?.displayName ?? ''} />
      </label>
      <CapabilityCheckboxes initial={initial} />
      <StateAndPriority enabled={initial?.enabled ?? true} priority={initial?.priority ?? 0} />
      <button className="button primary full" type="submit">{t('common.save')}</button>
    </form>
  );
}

function CapabilityCheckboxes({ initial }: { initial?: { supportsTts: boolean; supportsLlm: boolean } }) {
  const { t } = useI18n();
  return (
    <div className="form-grid">
      <label className="check-row">
        <input name="supportsTts" type="checkbox" defaultChecked={initial?.supportsTts ?? true} />
        {t('personalization.supportsTts')}
      </label>
      <label className="check-row">
        <input name="supportsLlm" type="checkbox" defaultChecked={initial?.supportsLlm ?? false} />
        {t('personalization.supportsLlm')}
      </label>
    </div>
  );
}

function StateAndPriority({ enabled, priority }: { enabled: boolean; priority: number }) {
  const { t } = useI18n();
  return (
    <div className="form-grid">
      <SwitchField name="enabled" label={t('common.enabled')} defaultChecked={enabled} />
      <label>
        {t('personalization.priority')}
        <input name="priority" type="number" min={0} defaultValue={priority} />
      </label>
    </div>
  );
}

function SwitchField({
  name,
  label,
  checked,
  defaultChecked,
  onChange
}: {
  name?: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: () => void;
}) {
  const inputProps = checked === undefined
    ? { defaultChecked: defaultChecked ?? false }
    : { checked, onChange };

  return (
    <label className="switch-field">
      <input name={name} type="checkbox" {...inputProps} />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      <span>{label}</span>
    </label>
  );
}

function providerKindText(providerKind: string, t: ReturnType<typeof useI18n>['t']) {
  if (providerKind === 'openai_compatible') return t('personalization.providerKindOpenAiCompatible');
  if (providerKind === 'custom') return t('personalization.providerKindCustom');
  return providerKind;
}
