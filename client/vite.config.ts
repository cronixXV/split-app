import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig({
  envDir: '..',
  plugins: [react(), tailwindcss()],
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
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules\/(react|react-dom)\//,
            },
            {
              name: 'vendor-router-effector',
              test: /node_modules\/(@tanstack\/react-router|effector|effector-react)\//,
            },
            {
              name: 'vendor-heroui',
              test: /node_modules\/(@heroui|@react-aria|@react-stately|@internationalized)\//,
            },
            {
              name: 'vendor-socket',
              test: /node_modules\/(socket\.io-client|engine\.io-client)\//,
            },
          ],
        },
      },
    },
  },
});
