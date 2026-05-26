import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit2,
  FileText,
  Folder,
  FolderOpen,
  List,
  Plus,
  RefreshCw,
  Save,
  Search,
  Tags,
  Trash2,
  Upload
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { bookApi, filesystemApi, scanApi, sourceApi, tagApi } from '../api/bookdApi';
import type { Book, BookSource, ChaptersResponse, DirectoryListResponse, Tag, TagWithStats } from '../api/types';
import { useConfirm } from '../components/ConfirmProvider';
import { Modal } from '../components/Modal';
import { EmptyState, LoadingState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import { useI18n, type I18nKey } from '../i18n';
import { formatDateTime, formatFileSize, formatNumber, formatRelativeBookTime } from '../utils/format';
import { buildMetadataUpdate, filterBooksBySource, mergeBooksFromTagResults, type TagFilterMode } from './bookAdminUtils';
import { TagsManagementSection } from './AdminTagsPage';
import { TxtRulesManagementSection } from './AdminTxtRulesPage';

type ScanTarget = { kind: 'all' } | { kind: 'source'; sourceId: number };
type BooksAdminTab = 'management' | 'list' | 'tags' | 'txt-rules';

const COLLAPSED_TAG_FILTER_HEIGHT = 112;

const booksAdminTabs = [
  { id: 'management', labelKey: 'books.tabManagement', icon: BookOpen },
  { id: 'list', labelKey: 'books.tabList', icon: List },
  { id: 'tags', labelKey: 'books.tabTags', icon: Tags },
  { id: 'txt-rules', labelKey: 'books.tabTxtRules', icon: FileText }
] satisfies Array<{ id: BooksAdminTab; labelKey: I18nKey; icon: typeof BookOpen }>;

function normalizeBooksAdminTab(tab: string | null): BooksAdminTab {
  return booksAdminTabs.some((item) => item.id === tab) ? (tab as BooksAdminTab) : 'management';
}

export function AdminBooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const { t } = useI18n();

  const activeTab = normalizeBooksAdminTab(searchParams.get('tab'));
  const enabledSources = useMemo(() => sources.filter((source) => source.enabled), [sources]);

  const selectTab = useCallback((tab: BooksAdminTab) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (tab === 'management') next.delete('tab');
      else next.set('tab', tab);
      return next;
    });
  }, [setSearchParams]);

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
      showToast(error instanceof Error ? error.message : t('books.loadFailed'), 'error');
      setBooks([]);
    }
  }, [selectedTags, sourceFilter, tagMode, showToast, t]);

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
      showToast(t('books.sourceRequired'), 'error');
      return;
    }
    try {
      await sourceApi.create(name, path);
      showToast(t('books.sourceAdded'), 'success');
      formElement.reset();
      await refreshStats();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('books.addFailed'), 'error');
    }
  }

  async function openDirectory(path: string) {
    setFileBrowserOpen(true);
    setDirectory(null);
    try {
      setDirectory(await filesystemApi.list(path));
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('books.directoryLoadFailed'), 'error');
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
      showToast(error instanceof Error ? error.message : t('common.operationFailed'), 'error');
    }
  }

  async function deleteSource(source: BookSource) {
    if (!(await confirm({ message: t('books.deleteSourceConfirm', { name: source.name }), danger: true }))) return;
    try {
      await sourceApi.delete(source.id);
      showToast(t('books.sourceDeleted'), 'success');
      await refreshStats();
      await loadBooks();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('users.deleteFailed'), 'error');
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
    if (scanTarget.kind === 'all' && !(await confirm({ message: t('books.scanAllConfirm') }))) return;
    setScanTarget(null);
    setScanning(true);
    try {
      const result = scanTarget.kind === 'all' ? await scanApi.all(fullScan) : await scanApi.source(scanTarget.sourceId, fullScan);
      showToast(t('books.scanDone', { found: result.found, imported: result.imported }), 'success');
      await refreshStats();
      await loadBooks();
      setSourceBooks({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('books.scanFailed'), 'error');
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
      <div className="subtab-bar" role="tablist" aria-label={t('books.tabsLabel')}>
        {booksAdminTabs.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={selected ? 'subtab active' : 'subtab'}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(item.id)}
            >
              <Icon size={16} />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'management' && (
        <>
          <section className="section">
            <div className="section-header">
              <h2>{t('books.tabManagement')}</h2>
              <div className="toolbar">
                <button className="button secondary" type="button" onClick={() => void refreshStats()}>
                  <RefreshCw size={16} />
                  {t('common.refresh')}
                </button>
                <button className="button primary" type="button" disabled={scanning} onClick={() => setScanTarget({ kind: 'all' })}>
                  <Search size={16} />
                  {t('books.scanAll')}
                </button>
              </div>
            </div>
            <div className="stats-grid compact">
              <div className="stat-card">
                <strong>{bookCount}</strong>
                <span>{t('dashboard.totalBooks')}</span>
              </div>
              <div className="stat-card">
                <strong>{sources.length}</strong>
                <span>{t('dashboard.sources')}</span>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>{t('books.addSource')}</h2>
            <form className="inline-form" onSubmit={addSource}>
              <label>
                {t('books.sourceName')}
                <input name="name" placeholder={t('books.sourceNamePlaceholder')} required />
              </label>
              <label className="grow">
                {t('books.filePath')}
                <input name="path" placeholder="/volume1/books" required />
              </label>
              <button className="button secondary" type="button" onClick={() => void openDirectory('/')}>
                <FolderOpen size={16} />
                {t('common.browse')}
              </button>
              <button className="button primary" type="submit">
                <Plus size={16} />
                {t('common.add')}
              </button>
            </form>
          </section>

          <section className="section">
            <h2>{t('books.sources')}</h2>
            {sources.length === 0 ? (
              <EmptyState label={t('books.noSources')} />
            ) : (
              <div className="list">
                {sources.map((source) => (
                  <article key={source.id} className="source-row">
                    <div className="source-line">
                      <button className="icon-button" type="button" onClick={() => void toggleSourceBooks(source.id)} aria-label={t('books.expandBooks')}>
                        {expandedSources.has(source.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <div className="grow">
                        <strong>{source.name}</strong>
                        <span className="path-text">{source.path}</span>
                      </div>
                      <span className={source.enabled ? 'pill' : 'pill muted-pill'}>{source.enabled ? t('common.enabled') : t('common.disabled')}</span>
                      <div className="row-actions">
                        <button className="button secondary" type="button" disabled={scanning} onClick={() => setScanTarget({ kind: 'source', sourceId: source.id })}>
                          <Search size={16} />
                          {t('books.scan')}
                        </button>
                        <button className="button secondary" type="button" onClick={() => void toggleSource(source)}>
                          {source.enabled ? t('common.disable') : t('common.enable')}
                        </button>
                        <button className="button danger" type="button" onClick={() => void deleteSource(source)}>
                          <Trash2 size={16} />
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                    {expandedSources.has(source.id) && (
                      <div className="nested-list">
                        {!sourceBooks[source.id] ? (
                          <LoadingState />
                        ) : sourceBooks[source.id].length === 0 ? (
                          <EmptyState label={t('books.noBooksInSource')} />
                        ) : (
                          sourceBooks[source.id].map((book) => (
                            <button key={book.id} className="book-line" type="button" onClick={() => setSelectedBookId(book.id)}>
                              <BookOpen size={16} />
                              <span>{book.title}</span>
                              <small>{book.author || t('common.unknownAuthor')} · {formatFileSize(book.fileSize, t)}</small>
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
        </>
      )}

      {activeTab === 'list' && (
        <section className="section">
          <div className="section-header">
            <h2>{t('books.list')}</h2>
            <div className="toolbar">
              <button className="button secondary" type="button" onClick={() => { setSelectedTags(new Set()); setSourceFilter(null); }}>
                {t('books.clearFilters')}
              </button>
              <button className="button secondary" type="button" onClick={() => setTagMode(tagMode === 'AND' ? 'OR' : 'AND')}>
                {t('books.tagMode', { mode: tagMode })}
              </button>
            </div>
          </div>
          <div className="filter-bar">
            <button className={sourceFilter === null ? 'chip active' : 'chip'} type="button" onClick={() => setSourceFilter(null)}>{t('books.allSources')}</button>
            {enabledSources.map((source) => (
              <button key={source.id} className={sourceFilter === source.id ? 'chip active' : 'chip'} type="button" onClick={() => setSourceFilter(source.id)}>
                {source.name}
              </button>
            ))}
          </div>
          {tags.length > 0 && (
            <CollapsibleTagFilter tags={tags} selectedTags={selectedTags} onToggle={toggleTag} />
          )}
          {!books ? (
            <LoadingState />
          ) : books.length === 0 ? (
            <EmptyState label={t('books.noBooks')} />
          ) : (
            <div className="book-grid">
              {books.map((book) => (
                <button key={book.id} className="book-card" type="button" onClick={() => setSelectedBookId(book.id)}>
                  <div className="book-cover">{book.coverPath ? <img src={book.coverPath} alt="" /> : <BookOpen size={36} />}</div>
                  <strong>{book.title}</strong>
                  <span>{book.author || t('common.unknownAuthor')}</span>
                  <small>{book.format?.toUpperCase()} · {formatRelativeBookTime(book, t)}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'tags' && <TagsManagementSection />}
      {activeTab === 'txt-rules' && <TxtRulesManagementSection />}

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

function CollapsibleTagFilter({
  tags,
  selectedTags,
  onToggle
}: {
  tags: TagWithStats[];
  selectedTags: Set<number>;
  onToggle: (tagId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const measure = useCallback(() => {
    const element = containerRef.current;
    setCanToggle((element?.scrollHeight ?? 0) > COLLAPSED_TAG_FILTER_HEIGHT + 1 || tags.length > 12);
  }, [tags.length]);

  useLayoutEffect(() => {
    measure();
  }, [measure, tags]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    if (!canToggle) setExpanded(false);
  }, [canToggle]);

  return (
    <div className="collapsible-filter">
      <div
        ref={containerRef}
        className={expanded ? 'filter-bar tag-filter-grid expanded' : 'filter-bar tag-filter-grid collapsed'}
        data-testid="book-list-tag-filter"
      >
        {tags.map((tag) => (
          <button key={tag.id} className={selectedTags.has(tag.id) ? 'chip active' : 'chip'} type="button" onClick={() => onToggle(tag.id)}>
            {tag.name}
          </button>
        ))}
      </div>
      {canToggle && (
        <button className="button secondary compact-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? t('tags.collapse') : t('tags.expand')}
        </button>
      )}
    </div>
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
  const { t } = useI18n();

  return (
    <Modal open={open} title={t('books.chooseFolder')} onClose={onClose} wide>
      {!directory ? (
        <LoadingState />
      ) : (
        <div className="file-browser">
          <div className="path-text">{directory.currentPath}</div>
          {directory.parentPath && (
            <button className="file-row" type="button" onClick={() => onOpenDirectory(directory.parentPath!)}>
              <Folder size={16} />
              {t('common.backToParent')}
            </button>
          )}
          {directory.directories.map((item) => (
            <div key={item.path} className="file-row">
              <button type="button" onClick={() => onOpenDirectory(item.path)}>
                <Folder size={16} />
                {item.name}
              </button>
              <button className="button secondary" type="button" onClick={() => onSelect(item.path)}>{t('common.select')}</button>
            </div>
          ))}
          {directory.directories.length === 0 && <EmptyState label={t('books.noSubfolders')} />}
        </div>
      )}
    </Modal>
  );
}

function ScanOptionsModal({ open, onClose, onExecute }: { open: boolean; onClose: () => void; onExecute: (fullScan: boolean) => void }) {
  const { t } = useI18n();

  return (
    <Modal open={open} title={t('books.scanOptions')} onClose={onClose}>
      <div className="choice-list">
        <button className="choice-button" type="button" onClick={() => onExecute(false)}>
          <strong>{t('books.incrementalScan')}</strong>
          <span>{t('books.incrementalScanDesc')}</span>
        </button>
        <button className="choice-button" type="button" onClick={() => onExecute(true)}>
          <strong>{t('books.fullScan')}</strong>
          <span>{t('books.fullScanDesc')}</span>
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
  const { t } = useI18n();

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
      showToast(error instanceof Error ? error.message : t('books.chaptersLoadFailed'), 'error');
    }
  }

  async function reparse() {
    if (!bookId) return;
    if (!(await confirm({ message: t('books.reparseConfirm') }))) return;
    try {
      await bookApi.reparse(bookId);
      showToast(t('books.reparseQueued'), 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('books.reparseFailed'), 'error');
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
      showToast(t('books.titleRequired'), 'error');
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
      showToast(t('books.saved'), 'success');
      await load();
      onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('books.saveFailed'), 'error');
    }
  }

  return (
    <Modal open={Boolean(bookId)} title={t('books.detailTitle')} onClose={onClose} wide>
      {!book ? (
        <LoadingState />
      ) : editMode ? (
        <form className="book-detail" onSubmit={save}>
          <div className="book-detail-cover">
            {coverPreview || book.coverPath ? <img src={coverPreview || book.coverPath || ''} alt="" /> : <BookOpen size={52} />}
            <label className="button secondary file-upload">
              <Upload size={16} />
              {t('books.changeCover')}
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
              {t('books.title')}
              <input name="title" defaultValue={book.title} />
            </label>
            <label>
              {t('books.author')}
              <input name="author" defaultValue={book.author ?? ''} />
            </label>
            <label>
              ISBN
              <input name="isbn" defaultValue={book.isbn ?? ''} />
            </label>
            <label>
              {t('books.publisher')}
              <input name="publisher" defaultValue={book.publisher ?? ''} />
            </label>
            <label>
              {t('books.description')}
              <textarea name="description" rows={5} defaultValue={book.description ?? ''} />
            </label>
            <TagEditor allTags={allTags} bookTags={bookTags} onAdd={(name) => void addTag(name)} onRemove={(id) => void removeTag(id)} />
            <div className="dialog-actions">
              <button className="button secondary" type="button" onClick={() => setEditMode(false)}>{t('common.cancel')}</button>
              <button className="button primary" type="submit">
                <Save size={16} />
                {t('common.save')}
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
                <p>{book.author || t('common.unknownAuthor')}</p>
              </div>
              <div className="toolbar">
                <button className="button secondary" type="button" onClick={() => void reparse()}>
                  <RefreshCw size={16} />
                  {t('books.reparse')}
                </button>
                <button className="button secondary" type="button" onClick={() => setEditMode(true)}>
                  <Edit2 size={16} />
                  {t('common.edit')}
                </button>
              </div>
            </div>
            <dl className="meta-grid">
              <div><dt>{t('books.format')}</dt><dd>{book.format?.toUpperCase()}</dd></div>
              <div><dt>{t('books.size')}</dt><dd>{formatFileSize(book.fileSize, t)}</dd></div>
              <div><dt>ISBN</dt><dd>{book.isbn || t('common.notSet')}</dd></div>
              <div><dt>{t('books.publisher')}</dt><dd>{book.publisher || t('common.unknown')}</dd></div>
              <div><dt>{t('books.updatedAt')}</dt><dd>{formatDateTime(book.updatedAt, t)}</dd></div>
              <div><dt>{t('books.chapters')}</dt><dd>{book.chaptersParsed ? t('common.chaptersCount', { count: book.chaptersCount }) : t('books.notParsed')}</dd></div>
            </dl>
            <p className="path-text">{book.filePath}</p>
            <div className="tag-row">
              {bookTags.length === 0 ? <span className="muted">{t('common.noTags')}</span> : bookTags.map((tag) => <span key={tag.id} className="pill">{tag.name}</span>)}
            </div>
            {book.description && <p className="description">{book.description}</p>}
            <button className="button secondary" type="button" onClick={() => void loadChapters()}>
              {t('books.loadChapters')}
            </button>
            {chapters && (
              <div className="chapters-list">
                {chapters.chapters.length === 0 ? <EmptyState label={t('books.noChapterInfo')} /> : chapters.chapters.map((chapter) => (
                  <div key={chapter.index} className="chapter-row" style={{ paddingLeft: `${chapter.level * 12 + 12}px` }}>
                    <strong>{chapter.index + 1}. {chapter.title}</strong>
                    <span>{t('books.chapterStat', {
                      words: formatNumber(chapter.wordCount),
                      images: chapter.imageCount > 0 ? t('books.chapterImages', { count: chapter.imageCount }) : ''
                    })}</span>
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
  const { t } = useI18n();

  return (
    <div className="tag-editor">
      <div className="tag-row">
        {bookTags.length === 0 ? <span className="muted">{t('common.noTags')}</span> : bookTags.map((tag) => (
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
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={t('tags.newTagPlaceholder')} />
        <button className="button secondary" type="button" onClick={() => { onAdd(value); setValue(''); }}>{t('tags.addTag')}</button>
      </div>
    </div>
  );
}
