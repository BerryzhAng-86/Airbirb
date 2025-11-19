import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1080,
  viewportHeight: 720,
  e2e: {
    baseUrl: 'http://localhost:3000',
  },
  defaultCommandTimeout: 20000,
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});

