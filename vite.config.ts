import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  preview: {
    port: 4173,
  },
  // Keep default chunking to avoid rare interop issues on some CDNs/UAs
  build: {
    target: 'es2018',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
