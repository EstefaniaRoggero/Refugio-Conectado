import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // En esta PC localhost:5173 puede resolver a otro proceso por IPv6.
    // Fijar IPv4 evita abrir otra aplicacion y mantiene estable el formulario.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'charts';
          }
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('sweetalert2')) return 'alerts';
          if (id.includes('@react-oauth')) return 'oauth';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
            return 'vendor-react';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
