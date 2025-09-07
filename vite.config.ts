import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      // Proxy API calls in dev to avoid CORS
      '/auth': {
        target: 'http://75.119.145.146:8899',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://75.119.145.146:8899',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://75.119.145.146:8899',
        changeOrigin: true,
        secure: false,
      },
      '/student': {
        target: 'http://75.119.145.146:8899',
        changeOrigin: true,
        secure: false,
      },
    },
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
