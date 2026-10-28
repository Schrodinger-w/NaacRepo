// The proxy below forwards /api to Express, so the browser only ever talks to one origin.
// That keeps the session cookie same-origin and avoids CORS entirely in development.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Pre-bundled at startup. Otherwise Vite can discover react-router-dom during the first page
  // load, rebuild its cache mid-load and briefly serve two copies of React ("Invalid hook call").
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
  },
  server: {
    port: 5173,
    // Fail rather than silently move to 5174, which CLIENT_ORIGIN in backend/.env would reject.
    strictPort: true,
    proxy: {
      // Must match HOST and PORT in backend/.env.
      '/api': 'http://127.0.0.1:5000',
    },
  },
});
