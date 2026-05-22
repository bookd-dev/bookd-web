export type UserRole = 'admin' | 'user' | 'guest' | string;

export interface User {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface InviteToken {
  id: number;
  token: string;
  createdBy: number;
  used: boolean;
}

export interface BookSource {
  id: number;
  name: string;
  path: string;
  enabled: boolean;
}

export interface DirectoryInfo {
  path: string;
  name: string;
  isDirectory: boolean;
  canRead: boolean;
  size: number;
}

export interface DirectoryListResponse {
  currentPath: string;
  parentPath: string | null;
  directories: DirectoryInfo[];
  files: DirectoryInfo[];
}

export interface Book {
  id: number;
  title: string;
  author: string | null;
  format: string;
  filePath: string;
  fileSize: number;
  coverPath: string | null;
  coverWidth?: number | null;
  coverHeight?: number | null;
  coverAspectRatio?: number | null;
  isbn: string | null;
  publisher: string | null;
  description: string | null;
  sourceId: number | null;
  chapterCount?: number;
  totalWordCount?: number;
  totalImageCount?: number;
  chaptersParsed: boolean;
  chaptersCount: number;
  lastParsedAt: string | null;
  parseStatus: string | null;
  parseProgress: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BooksResponse {
  books: Book[];
  total: number;
}

export interface BookCountResponse {
  count: number;
}

export interface ChapterInfo {
  index: number;
  title: string;
  wordCount: number;
  imageCount: number;
  level: number;
}

export interface ChaptersResponse {
  bookId: number;
  total: number;
  chapters: ChapterInfo[];
}

export interface BookMetadataUpdate {
  title?: string;
  author?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  description?: string | null;
  coverPath?: string | null;
}

export interface Tag {
  id: number;
  name: string;
  createdAt?: string | null;
}

export interface TagWithStats extends Tag {
  bookCount: number;
  createdAt: string;
}

export interface ScanResponse {
  found: number;
  imported: number;
  message: string;
}

export interface SourceScanStatus {
  sourceId: number;
  scanning: boolean;
  found: number;
  imported: number;
}

export interface ScanStatusResponse {
  scanning: boolean;
  sourceStatuses: Record<string, SourceScanStatus>;
}

export interface TxtParseRule {
  id: number;
  name: string;
  rule: string;
  example: string | null;
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface TxtParseRuleRequest {
  name: string;
  rule: string;
  example: string | null;
  enabled: boolean;
  priority: number;
}

export interface ImportRulesResponse {
  message: string;
  imported: number;
  skipped: number;
}

export interface AutoTagResponse {
  success: boolean;
  booksTagged: number;
  tagsCreated: number;
  totalBooks: number;
}

export interface MergeTagsResponse {
  success: boolean;
  targetTag: TagWithStats;
  mergedCount: number;
}

export interface BackgroundParseStatus {
  running: boolean;
  enabled: boolean;
  intervalSeconds: number;
  batchSize: number;
  unparsedBooksCount: number;
}
