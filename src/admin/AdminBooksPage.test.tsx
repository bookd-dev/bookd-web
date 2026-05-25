import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminBooksPage } from './AdminBooksPage';
import { ConfirmProvider } from '../components/ConfirmProvider';
import { ToastProvider } from '../components/ToastProvider';
import { bookApi, sourceApi, tagApi } from '../api/bookdApi';

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
    list: vi.fn()
  }
}));

function renderPage() {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <AdminBooksPage />
      </ConfirmProvider>
    </ToastProvider>
  );
}

describe('AdminBooksPage', () => {
  beforeEach(() => {
    vi.mocked(bookApi.count).mockResolvedValue({ count: 0 });
    vi.mocked(bookApi.list).mockResolvedValue({ books: [], total: 0 });
    vi.mocked(sourceApi.list).mockResolvedValue([]);
    vi.mocked(tagApi.list).mockResolvedValue([]);
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
});
