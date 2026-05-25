import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit2,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload
} from 'lucide-react';
import { bookApi, filesystemApi, scanApi, sourceApi, tagApi } from '../api/bookdApi';
import type { Book, BookSource, ChaptersResponse, DirectoryListResponse, Tag, TagWithStats } from '../api/types';
import { useConfirm } from '../components/ConfirmProvider';
import { Modal } from '../components/Modal';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import { formatDateTime, formatFileSize, formatNumber, formatRelativeBookTime } from '../utils/format';
import { buildMetadataUpdate, filterBooksBySource, mergeBooksFromTagResults, type TagFilterMode } from './bookAdminUtils';

type ScanTarget = { kind: 'all' } | { kind: 'source'; sourceId: number };

export function AdminBooksPage() {
  const [sources, setSources] = useState<BookSource[]>([]);
  const [tags, setTags] = useState<TagWithStats[]>([]);
  const [bookCount, setBookCount] = useState(0);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [sourceFilter, setSourceFilter] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [tagMode, setTagMode] = useState<TagFilterMode>('AND');
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [directory, setDirectory] = useState<DirectoryListResponse | null>(null);
  const [sourceBooks, setSourceBooks] = useState<Record<number, Book[]>>({});
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const enabledSources = useMemo(() => sources.filter((source) => source.enabled), [sources]);

  const refreshStats = useCallback(async () => {
    const [count, sourceList, tagList] = await Promise.all([bookApi.count(), sourceApi.list(), tagApi.list().catch(() => [])]);
    setBookCount(count.count);
    setSources(sourceList);
    setTags(tagList);
  }, []);

  const loadBooks = useCallback(async () => {
    setBooks(null);
    try {
      let nextBooks: Book[];
      const tagIds = Array.from(selectedTags);
      if (tagIds.length > 0) {
        const tagBooks = await Promise.all(tagIds.map((tagId) => tagApi.books(tagId)));
        nextBooks = filterBooksBySource(mergeBooksFromTagResults(tagBooks, tagMode), sourceFilter);
      } else {
        nextBooks = (await bookApi.list({ sourceId: sourceFilter, limit: 500 })).books;
      }
      setBooks(nextBooks);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '书籍加载失败', 'error');
      setBooks([]);
    }
  }, [selectedTags, sourceFilter, tagMode, showToast]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get('name') ?? '').trim();
    const path = String(form.get('path') ?? '').trim();
    if (!name || !path) {
      showToast('请填写源名称和路径', 'error');
      return;
    }
    try {
      await sourceApi.create(name, path);
      showToast('书籍源已添加', 'success');
      formElement.reset();
      await refreshStats();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '添加失败', 'error');
    }
  }

  async function openDirectory(path: string) {
    setFileBrowserOpen(true);
    setDirectory(null);
    try {
      setDirectory(await filesystemApi.list(path));
    } catch (error) {
      showToast(error instanceof Error ? error.message : '目录加载失败', 'error');
    }
  }

  function selectDirectory(path: string) {
    const input = document.querySelector<HTMLInputElement>('input[name="path"]');
    if (input) input.value = path;
    setFileBrowserOpen(false);
  }

  async function toggleSource(source: BookSource) {
    try {
      await sourceApi.toggle(source.id);
      await refreshStats();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败', 'error');
    }
  }

  async function deleteSource(source: BookSource) {
    if (!(await confirm({ message: `确定要删除书籍源 "${source.name}" 吗？`, danger: true }))) return;
    try {
      await sourceApi.delete(source.id);
      showToast('书籍源已删除', 'success');
      await refreshStats();
      await loadBooks();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    }
  }

  async function toggleSourceBooks(sourceId: number) {
    setExpandedSources((current) => {
      const next = new Set(current);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
    if (!sourceBooks[sourceId]) {
      const data = await bookApi.list({ sourceId, limit: 1000 });
      setSourceBooks((current) => ({ ...current, [sourceId]: data.books }));
    }
  }

  async function executeScan(fullScan: boolean) {
    if (!scanTarget) return;
    if (scanTarget.kind === 'all' && !(await confirm({ message: '确定要扫描所有启用的书籍源吗？' }))) return;
    setScanTarget(null);
    setScanning(true);
    try {
      const result = scanTarget.kind === 'all' ? await scanApi.all(fullScan) : await scanApi.source(scanTarget.sourceId, fullScan);
      showToast(`扫描完成：发现 ${result.found}，处理 ${result.imported}`, 'success');
      await refreshStats();
      await loadBooks();
      setSourceBooks({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : '扫描失败', 'error');
    } finally {
      setScanning(false);
    }
  }

  function toggleTag(tagId: number) {
    setSelectedTags((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  return (
    <main className="page-stack">
      <section className="section">
        <div className="section-header">
          <h2>书籍管理</h2>
          <div className="toolbar">
            <button className="button secondary" type="button" onClick={() => void refreshStats()}>
              <RefreshCw size={16} />
              刷新
            </button>
            <button className="button primary" type="button" disabled={scanning} onClick={() => setScanTarget({ kind: 'all' })}>
              <Search size={16} />
              扫描全部
            </button>
          </div>
        </div>
        <div className="stats-grid compact">
          <div className="stat-card">
            <strong>{bookCount}</strong>
            <span>图书总数</span>
          </div>
          <div className="stat-card">
            <strong>{sources.length}</strong>
            <span>书籍源</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>添加书籍源</h2>
        <form className="inline-form" onSubmit={addSource}>
          <label>
            源名称
            <input name="name" placeholder="个人收藏" required />
          </label>
          <label className="grow">
            文件路径
            <input name="path" placeholder="/volume1/books" required />
          </label>
          <button className="button secondary" type="button" onClick={() => void openDirectory('/')}>
            <FolderOpen size={16} />
            浏览
          </button>
          <button className="button primary" type="submit">
            <Plus size={16} />
            添加
          </button>
        </form>
      </section>

      <section className="section">
        <h2>书籍源</h2>
        {sources.length === 0 ? (
          <EmptyState label="暂无书籍源" />
        ) : (
          <div className="list">
            {sources.map((source) => (
              <article key={source.id} className="source-row">
                <div className="source-line">
                  <button className="icon-button" type="button" onClick={() => void toggleSourceBooks(source.id)} aria-label="展开书籍">
                    {expandedSources.has(source.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <div className="grow">
                    <strong>{source.name}</strong>
                    <span className="path-text">{source.path}</span>
                  </div>
                  <span className={source.enabled ? 'pill' : 'pill muted-pill'}>{source.enabled ? '已启用' : '已禁用'}</span>
                  <div className="row-actions">
                    <button className="button secondary" type="button" disabled={scanning} onClick={() => setScanTarget({ kind: 'source', sourceId: source.id })}>
                      <Search size={16} />
                      扫描
                    </button>
                    <button className="button secondary" type="button" onClick={() => void toggleSource(source)}>
                      {source.enabled ? '禁用' : '启用'}
                    </button>
                    <button className="button danger" type="button" onClick={() => void deleteSource(source)}>
                      <Trash2 size={16} />
                      删除
                    </button>
                  </div>
                </div>
                {expandedSources.has(source.id) && (
                  <div className="nested-list">
                    {!sourceBooks[source.id] ? (
                      <LoadingState />
                    ) : sourceBooks[source.id].length === 0 ? (
                      <EmptyState label="该书籍源暂无书籍" />
                    ) : (
                      sourceBooks[source.id].map((book) => (
                        <button key={book.id} className="book-line" type="button" onClick={() => setSelectedBookId(book.id)}>
                          <BookOpen size={16} />
                          <span>{book.title}</span>
                          <small>{book.author || '未知作者'} · {formatFileSize(book.fileSize)}</small>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>书籍列表</h2>
          <div className="toolbar">
            <button className="button secondary" type="button" onClick={() => { setSelectedTags(new Set()); setSourceFilter(null); }}>
              清除筛选
            </button>
            <button className="button secondary" type="button" onClick={() => setTagMode(tagMode === 'AND' ? 'OR' : 'AND')}>
              {tagMode} 模式
            </button>
          </div>
        </div>
        <div className="filter-bar">
          <button className={sourceFilter === null ? 'chip active' : 'chip'} type="button" onClick={() => setSourceFilter(null)}>所有来源</button>
          {enabledSources.map((source) => (
            <button key={source.id} className={sourceFilter === source.id ? 'chip active' : 'chip'} type="button" onClick={() => setSourceFilter(source.id)}>
              {source.name}
            </button>
          ))}
        </div>
        {tags.length > 0 && (
          <div className="filter-bar">
            {tags.map((tag) => (
              <button key={tag.id} className={selectedTags.has(tag.id) ? 'chip active' : 'chip'} type="button" onClick={() => toggleTag(tag.id)}>
                {tag.name}
              </button>
            ))}
          </div>
        )}
        {!books ? (
          <LoadingState />
        ) : books.length === 0 ? (
          <EmptyState label="暂无书籍" />
        ) : (
          <div className="book-grid">
            {books.map((book) => (
              <button key={book.id} className="book-card" type="button" onClick={() => setSelectedBookId(book.id)}>
                <div className="book-cover">{book.coverPath ? <img src={book.coverPath} alt="" /> : <BookOpen size={36} />}</div>
                <strong>{book.title}</strong>
                <span>{book.author || '未知作者'}</span>
                <small>{book.format?.toUpperCase()} · {formatRelativeBookTime(book)}</small>
              </button>
            ))}
          </div>
        )}
      </section>

      <FileBrowserModal
        open={fileBrowserOpen}
        directory={directory}
        onClose={() => setFileBrowserOpen(false)}
        onOpenDirectory={(path) => void openDirectory(path)}
        onSelect={selectDirectory}
      />
      <ScanOptionsModal open={Boolean(scanTarget)} onClose={() => setScanTarget(null)} onExecute={(fullScan) => void executeScan(fullScan)} />
      <BookDetailModal
        bookId={selectedBookId}
        allTags={tags}
        onClose={() => setSelectedBookId(null)}
        onChanged={() => {
          void refreshStats();
          void loadBooks();
          setSourceBooks({});
        }}
      />
    </main>
  );
}

function FileBrowserModal({
  open,
  directory,
  onClose,
  onOpenDirectory,
  onSelect
}: {
  open: boolean;
  directory: DirectoryListResponse | null;
  onClose: () => void;
  onOpenDirectory: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  return (
    <Modal open={open} title="选择文件夹" onClose={onClose} wide>
      {!directory ? (
        <LoadingState />
      ) : (
        <div className="file-browser">
          <div className="path-text">{directory.currentPath}</div>
          {directory.parentPath && (
            <button className="file-row" type="button" onClick={() => onOpenDirectory(directory.parentPath!)}>
              <Folder size={16} />
              返回上级
            </button>
          )}
          {directory.directories.map((item) => (
            <div key={item.path} className="file-row">
              <button type="button" onClick={() => onOpenDirectory(item.path)}>
                <Folder size={16} />
                {item.name}
              </button>
              <button className="button secondary" type="button" onClick={() => onSelect(item.path)}>选择</button>
            </div>
          ))}
          {directory.directories.length === 0 && <EmptyState label="该目录没有可选子目录" />}
        </div>
      )}
    </Modal>
  );
}

function ScanOptionsModal({ open, onClose, onExecute }: { open: boolean; onClose: () => void; onExecute: (fullScan: boolean) => void }) {
  return (
    <Modal open={open} title="扫描选项" onClose={onClose}>
      <div className="choice-list">
        <button className="choice-button" type="button" onClick={() => onExecute(false)}>
          <strong>增量扫描</strong>
          <span>只导入新书，跳过已存在的书籍。</span>
        </button>
        <button className="choice-button" type="button" onClick={() => onExecute(true)}>
          <strong>强制全量扫描</strong>
          <span>重新扫描所有文件，并重新提取元数据。</span>
        </button>
      </div>
    </Modal>
  );
}

function BookDetailModal({
  bookId,
  allTags,
  onClose,
  onChanged
}: {
  bookId: number | null;
  allTags: TagWithStats[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [bookTags, setBookTags] = useState<Tag[]>([]);
  const [chapters, setChapters] = useState<ChaptersResponse | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const load = useCallback(async () => {
    if (!bookId) return;
    setBook(null);
    const [nextBook, nextTags] = await Promise.all([bookApi.detail(bookId), tagApi.forBook(bookId).catch(() => [])]);
    setBook(nextBook);
    setBookTags(nextTags);
    setEditMode(false);
    setChapters(null);
    setCoverFile(null);
    setCoverPreview(null);
  }, [bookId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadChapters() {
    if (!bookId) return;
    try {
      setChapters(await bookApi.chapters(bookId));
    } catch (error) {
      showToast(error instanceof Error ? error.message : '章节加载失败', 'error');
    }
  }

  async function reparse() {
    if (!bookId) return;
    if (!(await confirm({ message: '确定要重新解析这本书的章节吗？' }))) return;
    try {
      await bookApi.reparse(bookId);
      showToast('已加入重解析队列', 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '重解析失败', 'error');
    }
  }

  async function addTag(tagName: string) {
    if (!bookId || !tagName.trim()) return;
    if (bookTags.some((tag) => tag.name === tagName.trim())) return;
    const tag = await tagApi.addToBook(bookId, tagName.trim());
    setBookTags((current) => [...current, tag]);
    onChanged();
  }

  async function removeTag(tagId: number) {
    if (!bookId) return;
    await tagApi.removeFromBook(bookId, tagId);
    setBookTags((current) => current.filter((tag) => tag.id !== tagId));
    onChanged();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!book || !bookId) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '').trim();
    if (!title) {
      showToast('书名不能为空', 'error');
      return;
    }
    try {
      let coverPath: string | null | undefined;
      if (coverFile) {
        const uploadData = new FormData();
        uploadData.append('cover', coverFile);
        uploadData.append('bookId', String(bookId));
        coverPath = (await bookApi.uploadCover(bookId, uploadData)).coverPath;
      }
      await bookApi.updateMetadata(bookId, buildMetadataUpdate({
        title,
        author: String(form.get('author') ?? ''),
        isbn: String(form.get('isbn') ?? ''),
        publisher: String(form.get('publisher') ?? ''),
        description: String(form.get('description') ?? ''),
        coverPath
      }));
      showToast('书籍已保存', 'success');
      await load();
      onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败', 'error');
    }
  }

  return (
    <Modal open={Boolean(bookId)} title="书籍详情" onClose={onClose} wide>
      {!book ? (
        <LoadingState />
      ) : editMode ? (
        <form className="book-detail" onSubmit={save}>
          <div className="book-detail-cover">
            {coverPreview || book.coverPath ? <img src={coverPreview || book.coverPath || ''} alt="" /> : <BookOpen size={52} />}
            <label className="button secondary file-upload">
              <Upload size={16} />
              更换封面
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setCoverFile(file);
                  setCoverPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>
          </div>
          <div className="book-detail-info form">
            <label>
              书名
              <input name="title" defaultValue={book.title} />
            </label>
            <label>
              作者
              <input name="author" defaultValue={book.author ?? ''} />
            </label>
            <label>
              ISBN
              <input name="isbn" defaultValue={book.isbn ?? ''} />
            </label>
            <label>
              出版社
              <input name="publisher" defaultValue={book.publisher ?? ''} />
            </label>
            <label>
              简介
              <textarea name="description" rows={5} defaultValue={book.description ?? ''} />
            </label>
            <TagEditor allTags={allTags} bookTags={bookTags} onAdd={(name) => void addTag(name)} onRemove={(id) => void removeTag(id)} />
            <div className="dialog-actions">
              <button className="button secondary" type="button" onClick={() => setEditMode(false)}>取消</button>
              <button className="button primary" type="submit">
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="book-detail">
          <div className="book-detail-cover">{book.coverPath ? <img src={book.coverPath} alt="" /> : <BookOpen size={52} />}</div>
          <div className="book-detail-info">
            <div className="section-header">
              <div>
                <h2>{book.title}</h2>
                <p>{book.author || '未知作者'}</p>
              </div>
              <div className="toolbar">
                <button className="button secondary" type="button" onClick={() => void reparse()}>
                  <RefreshCw size={16} />
                  重解析
                </button>
                <button className="button secondary" type="button" onClick={() => setEditMode(true)}>
                  <Edit2 size={16} />
                  编辑
                </button>
              </div>
            </div>
            <dl className="meta-grid">
              <div><dt>格式</dt><dd>{book.format?.toUpperCase()}</dd></div>
              <div><dt>大小</dt><dd>{formatFileSize(book.fileSize)}</dd></div>
              <div><dt>ISBN</dt><dd>{book.isbn || '未设置'}</dd></div>
              <div><dt>出版社</dt><dd>{book.publisher || '未知'}</dd></div>
              <div><dt>更新时间</dt><dd>{formatDateTime(book.updatedAt)}</dd></div>
              <div><dt>章节</dt><dd>{book.chaptersParsed ? `${book.chaptersCount} 章` : '未解析'}</dd></div>
            </dl>
            <p className="path-text">{book.filePath}</p>
            <div className="tag-row">
              {bookTags.length === 0 ? <span className="muted">暂无标签</span> : bookTags.map((tag) => <span key={tag.id} className="pill">{tag.name}</span>)}
            </div>
            {book.description && <p className="description">{book.description}</p>}
            <button className="button secondary" type="button" onClick={() => void loadChapters()}>
              加载章节
            </button>
            {chapters && (
              <div className="chapters-list">
                {chapters.chapters.length === 0 ? <EmptyState label="暂无章节信息" /> : chapters.chapters.map((chapter) => (
                  <div key={chapter.index} className="chapter-row" style={{ paddingLeft: `${chapter.level * 12 + 12}px` }}>
                    <strong>{chapter.index + 1}. {chapter.title}</strong>
                    <span>{formatNumber(chapter.wordCount)} 字{chapter.imageCount > 0 ? ` · ${chapter.imageCount} 张图` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function TagEditor({
  allTags,
  bookTags,
  onAdd,
  onRemove
}: {
  allTags: TagWithStats[];
  bookTags: Tag[];
  onAdd: (name: string) => void;
  onRemove: (id: number) => void;
}) {
  const [value, setValue] = useState('');
  const currentNames = new Set(bookTags.map((tag) => tag.name));

  return (
    <div className="tag-editor">
      <div className="tag-row">
        {bookTags.length === 0 ? <span className="muted">暂无标签</span> : bookTags.map((tag) => (
          <button key={tag.id} className="pill removable" type="button" onClick={() => onRemove(tag.id)}>
            {tag.name} ×
          </button>
        ))}
      </div>
      <div className="filter-bar">
        {allTags.filter((tag) => !currentNames.has(tag.name)).slice(0, 20).map((tag) => (
          <button key={tag.id} className="chip" type="button" onClick={() => onAdd(tag.name)}>{tag.name}</button>
        ))}
      </div>
      <div className="inline-form compact-form">
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="新标签名称" />
        <button className="button secondary" type="button" onClick={() => { onAdd(value); setValue(''); }}>添加标签</button>
      </div>
    </div>
  );
}
