import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared/src'),
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
