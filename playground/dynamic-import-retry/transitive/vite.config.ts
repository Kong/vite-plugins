import { defineConfig } from 'vite'
import { resolve } from 'node:path'

import { DynamicImportRetryPlugin } from '../../../src/plugin-dynamic-import-retry'

export default defineConfig({
  root: resolve(__dirname),
  plugins: [
    DynamicImportRetryPlugin(),
  ],
  build: {
    minify: false,
    outDir: 'dist',
    target: 'esnext',
    emptyOutDir: true,
  },
})
