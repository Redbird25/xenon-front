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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('react-router')) return 'react-vendor';
            if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
            if (id.includes('framer-motion') || id.includes('@tanstack') || id.includes('axios') || id.includes('recharts') || id.includes('socket.io-client')) return 'vendor';
          }
        },
      },
    },
  },
});
