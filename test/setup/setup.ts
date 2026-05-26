import '@testing-library/jest-dom/vitest';
import { resetLocaleForTests } from '../../src/i18n';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  resetLocaleForTests();
});
