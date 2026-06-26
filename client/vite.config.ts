import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),

      '@shared/types': fileURLToPath(
        new URL('../shared/src/index.ts', import.meta.url)
      ),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,

    proxy: {
      '/api': {
        target: 'http://server:3001',
        changeOrigin: true,
      },

      '/socket.io': {
        target: 'http://server:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
