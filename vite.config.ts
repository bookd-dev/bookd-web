import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:7919',
      '/covers': 'http://localhost:7919',
      '/book_images': 'http://localhost:7919'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
