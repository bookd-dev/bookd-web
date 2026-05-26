import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminLayout } from '../../src/admin/AdminLayout';
import { authApi } from '../../src/api/bookdApi';
import { ConfirmProvider, useConfirm } from '../../src/components/ConfirmProvider';
import { EmptyState } from '../../src/components/States';
import { ToastProvider } from '../../src/components/ToastProvider';
import { LoginPage } from '../../src/routes/LoginPage';
import { SetupPage } from '../../src/routes/SetupPage';
import { LocaleProvider, setCurrentLocale, type Locale } from '../../src/i18n';

vi.mock('../../src/api/bookdApi', () => ({
  authApi: {
    hasAdmin: vi.fn(),
    me: vi.fn(),
    logout: vi.fn()
  }
}));

function renderWithProviders(element: ReactElement, locale: Locale = 'zh-CN') {
  setCurrentLocale(locale);
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <ToastProvider>
          <ConfirmProvider>{element}</ConfirmProvider>
        </ToastProvider>
      </LocaleProvider>
    </MemoryRouter>
  );
}

function ConfirmProbe() {
  const { confirm } = useConfirm();
  return (
    <button type="button" onClick={() => void confirm({ message: 'Delete Book A?' })}>
      Open
    </button>
  );
}

describe('localized rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.hasAdmin).mockResolvedValue({ hasAdmin: true });
    vi.mocked(authApi.me).mockResolvedValue({ id: 1, username: 'admin', email: null, role: 'admin' });
    vi.mocked(authApi.logout).mockResolvedValue({});
  });

  test('renders login page in Chinese and switches to English', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('图书管理系统')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('语言'), 'en');

    expect(screen.getByText('Library management system')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Sign In' })).toHaveLength(2);
  });

  test('renders setup page in English', () => {
    vi.mocked(authApi.hasAdmin).mockResolvedValue({ hasAdmin: false });

    renderWithProviders(<SetupPage />, 'en');

    expect(screen.getByRole('heading', { name: 'Welcome to Bookd' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create administrator' })).toBeInTheDocument();
  });

  test('renders admin layout in English while keeping API username unchanged', async () => {
    renderWithProviders(<AdminLayout />, 'en');

    expect(screen.getByRole('heading', { name: 'Bookd Ebook Admin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Books/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/admin · Administrator/)).toBeInTheDocument());
  });

  test('renders shared confirm and empty state text in English', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ConfirmProbe />
        <EmptyState label="No rows" />
      </>,
      'en'
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('heading', { name: 'Confirm Action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByText('No rows')).toBeInTheDocument();
  });
});
