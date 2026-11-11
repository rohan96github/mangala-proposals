import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // Listen on all IPv4 & IPv6 interfaces
    port: 5173,
    allowedHosts: true, // Allow tunnels (Localtunnel, Cloudflare Tunnel, etc.)
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

