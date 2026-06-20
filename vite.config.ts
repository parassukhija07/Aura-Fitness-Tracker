import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // base './' is mandatory — Capacitor loads assets via relative paths from the
  // filesystem; absolute '/' paths break in the wrapped app.
  base: './',
  server: {
    port: 5173,
  },
});
