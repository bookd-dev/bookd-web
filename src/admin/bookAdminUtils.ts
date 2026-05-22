import type { Book, BookMetadataUpdate } from '../api/types';

export type TagFilterMode = 'AND' | 'OR';

export function buildMetadataUpdate(input: {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  description: string;
  coverPath?: string | null;
}): BookMetadataUpdate {
  return {
    title: input.title.trim(),
    author: input.author.trim() || null,
    isbn: input.isbn.trim() || null,
    publisher: input.publisher.trim() || null,
    description: input.description.trim() || null,
    ...(input.coverPath !== undefined ? { coverPath: input.coverPath } : {})
  };
}

export function mergeBooksFromTagResults(results: Book[][], mode: TagFilterMode): Book[] {
  if (results.length === 0) return [];
  const maps = results.map((books) => new Map(books.map((book) => [book.id, book])));
  if (mode === 'AND') {
    return results[0].filter((book) => maps.every((map) => map.has(book.id)));
  }
  const merged = new Map<number, Book>();
  results.flat().forEach((book) => merged.set(book.id, book));
  return Array.from(merged.values());
}

export function filterBooksBySource(books: Book[], sourceId: number | null): Book[] {
  if (!sourceId) return books;
  return books.filter((book) => book.sourceId === sourceId);
}
