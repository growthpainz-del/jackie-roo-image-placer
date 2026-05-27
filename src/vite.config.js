import { defineConfig } from 'vite';
import base44 from '@base44/vite-plugin';

export default defineConfig({
  plugins: [
    base44(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-dom/client'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});