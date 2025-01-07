import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

import { DynamicImportRetryPlugin } from '../../../src/plugin-dynamic-import-retry'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'silent',
  root: resolve(__dirname),
  plugins: [
    vue(),
    DynamicImportRetryPlugin(),
  ],
  build: {
    minify: false,
    outDir: 'dist',
    target: 'esnext',
    emptyOutDir: false,
  },
})
