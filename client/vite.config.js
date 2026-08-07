import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/roast': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/config': 'http://localhost:3000',
    },
  },
});
