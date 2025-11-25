import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    base: '/',
    build: {
      outDir: 'dist',
      rollupOptions: {
        external: ['@google/genai'],
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});