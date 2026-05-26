import type { Book } from '../../src/api/types';
import { buildMetadataUpdate, filterBooksBySource, mergeBooksFromTagResults } from '../../src/admin/bookAdminUtils';

function book(id: number, sourceId: number | null): Book {
  return {
    id,
    title: `Book ${id}`,
    author: null,
    format: 'epub',
    filePath: `/b/${id}.epub`,
    fileSize: 1,
    coverPath: null,
    isbn: null,
    publisher: null,
    description: null,
    sourceId,
    chaptersParsed: false,
    chaptersCount: 0,
    lastParsedAt: null,
    parseStatus: null,
    parseProgress: 0,
    createdAt: null,
    updatedAt: null
  };
}

describe('book admin utilities', () => {
  test('builds metadata update with trimmed title and nullable optional fields', () => {
    expect(buildMetadataUpdate({
      title: '  New Title  ',
      author: ' ',
      isbn: '123',
      publisher: '',
      description: '  desc ',
      coverPath: '/covers/1.jpg'
    })).toEqual({
      title: 'New Title',
      author: null,
      isbn: '123',
      publisher: null,
      description: 'desc',
      coverPath: '/covers/1.jpg'
    });
  });

  test('merges tag results with AND and OR modes', () => {
    const a = book(1, 1);
    const b = book(2, 1);
    const c = book(3, 2);

    expect(mergeBooksFromTagResults([[a, b], [b, c]], 'AND').map((item) => item.id)).toEqual([2]);
    expect(mergeBooksFromTagResults([[a, b], [b, c]], 'OR').map((item) => item.id)).toEqual([1, 2, 3]);
  });

  test('filters tag result books by source', () => {
    expect(filterBooksBySource([book(1, 1), book(2, 2)], 2).map((item) => item.id)).toEqual([2]);
  });
});
