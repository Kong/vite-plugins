import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

import { DynamicImportRetryPlugin } from '../../../src/plugin-dynamic-import-retry'

export default defineConfig({
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
