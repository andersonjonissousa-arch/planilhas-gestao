/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa para funcionar em qualquer hospedagem estática (GitHub Pages, intranet, pasta local)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 600, rollupOptions: { output: { manualChunks: { graficos: ['recharts'], react: ['react', 'react-dom', 'react-router-dom'] } } } },
  test: { environment: 'node' },
});
