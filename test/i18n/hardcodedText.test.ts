import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../src');
const allowedFiles = new Set([
  'admin/AdminTxtRulesPage.tsx'
]);

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'i18n' ? [] : collectSourceFiles(path);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    if (/\.test\.(ts|tsx)$/.test(entry.name)) return [];
    return [path];
  });
}

describe('hardcoded user-facing text guard', () => {
  test('keeps Chinese UI text inside i18n resources', () => {
    const offenders = collectSourceFiles(sourceRoot)
      .map((path) => ({
        path: relative(sourceRoot, path),
        content: readFileSync(path, 'utf8')
      }))
      .filter((file) => !allowedFiles.has(file.path))
      .filter((file) => /\p{Script=Han}/u.test(file.content))
      .map((file) => file.path);

    expect(offenders).toEqual([]);
  });
});
