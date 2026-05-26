import '@testing-library/jest-dom/vitest';
import { resetLocaleForTests } from '../i18n';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  resetLocaleForTests();
});
