import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars'

import { DynamicImportRetryPlugin } from '../../../src/plugin-dynamic-import-retry'

export default defineConfig({
  root: resolve(__dirname),
  build: {
    // minify: false,
    outDir: 'dist',
    target: 'esnext',
    emptyOutDir: true,
    rollupOptions: {
      plugins: [
        dynamicImportVars({
          exclude: /node_modules/,
        }),
        DynamicImportRetryPlugin(),
      ],
    },
  },
})
