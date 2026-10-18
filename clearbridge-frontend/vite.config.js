import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Keep PDF uploads on the browser's origin, including when using a LAN URL.
      // Translation keeps its existing connection.
      '/api/voice': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/analyze-image': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/chat': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/analyze-document': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
