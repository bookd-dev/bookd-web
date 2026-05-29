import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminPersonalizationPage } from '../../src/admin/AdminPersonalizationPage';
import { aiEndpointApi, aiModelApi, aiProviderApi, personalizationApi } from '../../src/api/bookdApi';
import type { PersonalizationOverview } from '../../src/api/types';
import { ConfirmProvider } from '../../src/components/ConfirmProvider';
import { ToastProvider } from '../../src/components/ToastProvider';
import { LocaleProvider, setCurrentLocale, type Locale } from '../../src/i18n';

vi.mock('../../src/api/bookdApi', () => ({
  personalizationApi: {
    overview: vi.fn(),
    updateTimeZone: vi.fn()
  },
  aiProviderApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createEndpoint: vi.fn()
  },
  aiEndpointApi: {
    update: vi.fn(),
    delete: vi.fn(),
    createModel: vi.fn()
  },
  aiModelApi: {
    update: vi.fn(),
    delete: vi.fn()
  }
}));

const overview: PersonalizationOverview = {
  settings: { timeZone: 'Asia/Shanghai' },
  providers: [
    {
      id: 1,
      name: 'GPT',
      providerKind: 'openai_compatible',
      enabled: true,
      priority: 1,
      createdAt: '2026-05-29T00:00',
      updatedAt: '2026-05-29T00:00',
      endpoints: [
        {
          id: 2,
          providerId: 1,
          baseUrl: 'https://api.example.com/v1',
          apiKeySet: true,
          maxConcurrency: 2,
          enabled: true,
          priority: 2,
          createdAt: '2026-05-29T00:00',
          updatedAt: '2026-05-29T00:00',
          models: [
            {
              id: 3,
              endpointId: 2,
              modelName: 'tts-1',
              displayName: 'TTS One',
              supportsTts: true,
              supportsLlm: false,
              enabled: true,
              priority: 1,
              createdAt: '2026-05-29T00:00',
              updatedAt: '2026-05-29T00:00'
            }
          ]
        }
      ]
    }
  ]
};
const sampleProvider = overview.providers[0];
const sampleEndpoint = sampleProvider.endpoints![0];
const sampleModel = sampleEndpoint.models![0];

function renderPage(locale: Locale = 'zh-CN') {
  setCurrentLocale(locale);
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AdminPersonalizationPage />
          </ConfirmProvider>
        </ToastProvider>
      </LocaleProvider>
    </MemoryRouter>
  );
}

describe('AdminPersonalizationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(personalizationApi.overview).mockResolvedValue(overview);
    vi.mocked(personalizationApi.updateTimeZone).mockResolvedValue({ timeZone: 'UTC' });
    vi.mocked(aiProviderApi.create).mockResolvedValue(sampleProvider);
    vi.mocked(aiProviderApi.update).mockResolvedValue(sampleProvider);
    vi.mocked(aiProviderApi.createEndpoint).mockResolvedValue(sampleEndpoint);
    vi.mocked(aiEndpointApi.update).mockResolvedValue(sampleEndpoint);
    vi.mocked(aiEndpointApi.createModel).mockResolvedValue(sampleModel);
    vi.mocked(aiModelApi.update).mockResolvedValue(sampleModel);
  });

  test('renders personalization child tabs and switches to AI configuration in Chinese', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: '系统偏好' })).toBeInTheDocument();
    expect(screen.getByLabelText('应用时区')).toHaveValue('Asia/Shanghai');
    expect(screen.getByRole('tab', { name: '系统偏好' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'AI 服务' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByText('GPT')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'AI 服务' }));

    expect(screen.getByRole('tab', { name: '系统偏好' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'AI 服务' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'AI 服务' })).toBeInTheDocument();
    expect(screen.getByText('GPT')).toBeInTheDocument();
    expect(screen.getByText('OpenAI 兼容 · 优先级 1')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/v1')).toBeInTheDocument();
    expect(screen.getByText('并发 2 · 优先级 2 · 已配置 API_KEY')).toBeInTheDocument();
    expect(screen.getByText('TTS One')).toBeInTheDocument();
    expect(screen.getByText('tts-1 · 优先级 1 · TTS')).toBeInTheDocument();
    const providerList = screen.getByTestId('ai-provider-list');
    expect(within(providerList).getByLabelText('已启用')).toBeChecked();
    expect(within(providerList).getAllByRole('button', { name: '编辑' })).toHaveLength(1);
    expect(within(providerList).queryByRole('button', { name: '添加 API 地址' })).not.toBeInTheDocument();
    expect(within(providerList).queryByRole('button', { name: '添加模型' })).not.toBeInTheDocument();
    expect(within(providerList).queryByRole('button', { name: '删除' })).not.toBeInTheDocument();
    expect(screen.queryByText('old-key')).not.toBeInTheDocument();
  });

  test('saves time zone through the settings API', async () => {
    const user = userEvent.setup();
    renderPage();

    const timeZoneInput = await screen.findByLabelText('应用时区');
    await user.clear(timeZoneInput);
    await user.type(timeZoneInput, 'UTC');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(personalizationApi.updateTimeZone).toHaveBeenCalledWith('UTC'));
    expect(await screen.findByText('时区已保存')).toBeInTheDocument();
  });

  test('creates provider without hidden capability defaults', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'AI 服务' }));
    await user.click(screen.getByRole('button', { name: '添加提供商' }));
    const dialog = screen.getAllByRole('dialog').at(-1)!;
    expect(within(dialog).queryByLabelText('支持 TTS')).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText('支持 LLM')).not.toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('提供商名称'), 'Custom');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(aiProviderApi.create).toHaveBeenCalledWith({
        name: 'Custom',
        providerKind: 'openai_compatible',
        enabled: true,
        priority: 0
      });
    });
  });

  test('toggles provider enabled from the AI service list switch', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'AI 服务' }));
    await user.click(screen.getByLabelText('已启用'));

    await waitFor(() => {
      expect(aiProviderApi.update).toHaveBeenCalledWith(1, {
        name: 'GPT',
        providerKind: 'openai_compatible',
        enabled: false,
        priority: 1
      });
    });
  });

  test('edits endpoint without capabilities or replacing existing API key', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'AI 服务' }));
    await user.click(screen.getByRole('button', { name: '编辑' }));
    expect(screen.queryByText('old-key')).not.toBeInTheDocument();
    const dialog = screen.getAllByRole('dialog').at(-1)!;
    const endpointInput = within(dialog).getByDisplayValue('https://api.example.com/v1');
    const endpointForm = endpointInput.closest('form');
    expect(endpointForm).not.toBeNull();
    expect(within(endpointForm!).queryByLabelText('支持 TTS')).not.toBeInTheDocument();
    expect(within(endpointForm!).queryByLabelText('支持 LLM')).not.toBeInTheDocument();
    await user.click(within(endpointForm!).getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(aiEndpointApi.update).toHaveBeenCalledWith(2, expect.objectContaining({ apiKey: null }));
    });
    expect(vi.mocked(aiEndpointApi.update).mock.calls[0][1]).not.toHaveProperty('supportsTts');
    expect(vi.mocked(aiEndpointApi.update).mock.calls[0][1]).not.toHaveProperty('supportsLlm');
  });

  test('deletes endpoint from provider editor with a cascading delete confirmation', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'AI 服务' }));
    await user.click(screen.getByRole('button', { name: '编辑' }));
    const dialog = screen.getAllByRole('dialog').at(-1)!;
    const endpointInput = within(dialog).getByDisplayValue('https://api.example.com/v1');
    const endpointItem = endpointInput.closest('.editor-item');
    expect(endpointItem).not.toBeNull();

    await user.click(within(endpointItem as HTMLElement).getByRole('button', { name: '删除' }));
    expect(screen.getByText('确定要删除 API 地址 "https://api.example.com/v1" 吗？其模型配置也会删除。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认' }));

    await waitFor(() => expect(aiEndpointApi.delete).toHaveBeenCalledWith(2));
  });

  test('treats omitted provider endpoints and endpoint models as empty lists', async () => {
    const user = userEvent.setup();
    vi.mocked(personalizationApi.overview).mockResolvedValue({
      settings: { timeZone: 'Asia/Shanghai' },
      providers: [
        {
          id: 9,
          name: 'No Endpoint Provider',
          providerKind: 'custom',
          enabled: true,
          priority: 1,
          createdAt: '2026-05-29T00:00',
          updatedAt: '2026-05-29T00:00'
        },
        {
          id: 10,
          name: 'No Model Provider',
          providerKind: 'custom',
          enabled: true,
          priority: 2,
          createdAt: '2026-05-29T00:00',
          updatedAt: '2026-05-29T00:00',
          endpoints: [
            {
              id: 11,
              providerId: 10,
              baseUrl: 'https://tts.example.com/v1',
              apiKeySet: false,
              maxConcurrency: 1,
              enabled: true,
              priority: 1,
              createdAt: '2026-05-29T00:00',
              updatedAt: '2026-05-29T00:00'
            }
          ]
        }
      ]
    });

    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'AI 服务' }));

    expect(screen.getByText('No Endpoint Provider')).toBeInTheDocument();
    expect(screen.getByText('https://tts.example.com/v1')).toBeInTheDocument();
    expect(screen.getByText('暂无 API 地址')).toBeInTheDocument();
    expect(screen.getByText('暂无模型')).toBeInTheDocument();
  });

  test('keeps TTS and LLM capability controls on model form only', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'AI 服务' }));
    await user.click(screen.getByRole('button', { name: '编辑' }));
    const dialog = screen.getAllByRole('dialog').at(-1)!;
    const providerForm = within(dialog).getByDisplayValue('GPT').closest('form');
    const endpointForm = within(dialog).getByDisplayValue('https://api.example.com/v1').closest('form');
    expect(providerForm).not.toBeNull();
    expect(endpointForm).not.toBeNull();

    expect(within(providerForm!).queryByLabelText('支持 TTS')).not.toBeInTheDocument();
    expect(within(providerForm!).queryByLabelText('支持 LLM')).not.toBeInTheDocument();
    expect(within(endpointForm!).queryByLabelText('支持 TTS')).not.toBeInTheDocument();
    expect(within(endpointForm!).queryByLabelText('支持 LLM')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('支持 TTS')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('支持 LLM')).toBeInTheDocument();
  });

  test('renders representative English personalization text', async () => {
    renderPage('en');

    expect(await screen.findByRole('heading', { name: 'System Preferences' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'System Preferences' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'AI Services' })).toHaveAttribute('aria-selected', 'false');

    await userEvent.setup().click(screen.getByRole('tab', { name: 'AI Services' }));

    expect(screen.getByRole('heading', { name: 'AI Services' })).toBeInTheDocument();
    expect(screen.getByText('Concurrency 2 · Priority 2 · API_KEY configured')).toBeInTheDocument();
  });
});
