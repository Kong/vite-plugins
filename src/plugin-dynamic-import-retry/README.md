# plugin-dynamic-import-retry

This plugin provides a retry mechanism for dynamic imports (both JS and CSS) in Vite. It helps to handle cases where dynamic imports might fail due to network issues or other transient problems by retrying the import a specified number of times.

Inspired by [fatso83/retry-dynamic-import](https://github.com/fatso83/retry-dynamic-import).

## Usage

Import and use the plugin in your Vite configuration file:
```typescript
import { defineConfig } from 'vite'
import DynamicImportRetryPlugin from '@kong/vite-plugins/dynamic-import-retry'

export default defineConfig({
  plugins: [
    DynamicImportRetryPlugin(),
  ],
})
```

## Configuration Options

| Option   | Type                                      | Description                                                   |
|----------|-------------------------------------------|---------------------------------------------------------------|
| include  | string \| RegExp \| (string \| RegExp)[]  | Files to include, default is `\.(js\|ts\|vue\|tsx)$`.          |
| exclude  | string \| RegExp \| (string \| RegExp)[]  | Files to exclude. default is `/node_modules/`                  |
| retries  | number                                    | Number of retry attempts, default is `3`.                      |

## Limitations

**Transitive imports:** This plugin only retries the top-level dynamic import. If the import itself contains other static imports, those will not be retried.
```ts
import('./a.js') // when you import `a.js`, it contains a static import for `b.js`

// a.js
import './b.js'
// if `b.js` fails, even `a.js` itself is loaded successfully
// it still triggers a retry for `a.js` but it won't succeed because `b.js` is not retried.
```

## Work with @rollup/plugin-dynamic-import-vars
If you are using [@rollup/plugin-dynamic-import-vars](https://www.npmjs.com/package/@rollup/plugin-dynamic-import-vars) to import dynamic modules with variables, the order of the plugins matters.

Please make sure to put `dynamic-import-vars` before `dynamic-import-retry` in the plugins list.

```typescript
build: {
  // minify: false,
  outDir: 'dist',
  target: 'esnext',
  emptyOutDir: true,
  rollupOptions: {
    plugins: [
      dynamicImportVars(),
      DynamicImportRetryPlugin(),
    ],
  },
},
```
