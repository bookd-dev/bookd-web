import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminBooksPage } from './AdminBooksPage';
import { ConfirmProvider } from '../components/ConfirmProvider';
import { ToastProvider } from '../components/ToastProvider';
import { bookApi, sourceApi, tagApi, txtRuleApi } from '../api/bookdApi';

vi.mock('../api/bookdApi', () => ({
  bookApi: {
    count: vi.fn(),
    list: vi.fn()
  },
  filesystemApi: {
    list: vi.fn()
  },
  scanApi: {
    all: vi.fn(),
    source: vi.fn()
  },
  sourceApi: {
    create: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    toggle: vi.fn()
  },
  tagApi: {
    books: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    autoTagAll: vi.fn(),
    merge: vi.fn()
  },
  txtRuleApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggle: vi.fn(),
    importJson: vi.fn()
  }
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AdminBooksPage />
        </ConfirmProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('AdminBooksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bookApi.count).mockResolvedValue({ count: 0 });
    vi.mocked(bookApi.list).mockResolvedValue({ books: [], total: 0 });
    vi.mocked(sourceApi.list).mockResolvedValue([]);
    vi.mocked(tagApi.list).mockResolvedValue([]);
    vi.mocked(txtRuleApi.list).mockResolvedValue([]);
  });

  test('resets source form after asynchronous source creation succeeds', async () => {
    const user = userEvent.setup();
    vi.mocked(sourceApi.create).mockResolvedValue({
      id: 6,
      name: '电子书',
      path: '/Users/test/ebook/EBook',
      enabled: true
    });

    renderPage();

    const nameInput = screen.getByLabelText('源名称');
    const pathInput = screen.getByLabelText('文件路径');
    await user.type(nameInput, '电子书');
    await user.type(pathInput, '/Users/test/ebook/EBook');
    await user.click(screen.getByRole('button', { name: '添加' }));

    await waitFor(() => {
      expect(sourceApi.create).toHaveBeenCalledWith('电子书', '/Users/test/ebook/EBook');
    });
    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(pathInput).toHaveValue('');
    });
  });

  test('given many tags when opening book list tab then tag filters collapse and expand', async () => {
    const user = userEvent.setup();
    const manyTags = Array.from({ length: 16 }, (_, index) => ({
      id: index + 1,
      name: `标签${index + 1}`,
      bookCount: index,
      createdAt: '2026-05-25T00:00:00Z'
    }));
    vi.mocked(tagApi.list).mockResolvedValue(manyTags);

    renderPage();

    await user.click(screen.getByRole('tab', { name: /书籍列表/ }));

    const tagFilter = await screen.findByTestId('book-list-tag-filter');
    expect(tagFilter).toHaveClass('collapsed');

    await user.click(await screen.findByRole('button', { name: '展开标签' }));

    expect(tagFilter).toHaveClass('expanded');
    expect(screen.getByRole('button', { name: '收起标签' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('given book management page when switching subtabs then tags and txt rules render inside it', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(screen.getByRole('tab', { name: /标签管理/ }));
    expect(await screen.findByRole('heading', { name: '标签管理' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /TXT规则/ }));
    expect(await screen.findByRole('heading', { name: 'TXT 解析规则' })).toBeInTheDocument();
    expect(txtRuleApi.list).toHaveBeenCalled();
  });
});
