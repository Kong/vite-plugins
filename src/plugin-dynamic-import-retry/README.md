# plugin-dynamic-import-retry

This plugin provides a retry mechanism for dynamic imports (both JS and CSS) in Vite. It helps to handle cases where dynamic imports might fail due to network issues or other transient problems by retrying the import a specified number of times.

### Usage

Import and use the plugin in your Vite configuration file:
```typescript
import { defineConfig } from 'vite'
import DynamicImportRetryPlugin from '@kong/vite-plugins/dynamic-import-retry'

export default defineConfig({
  plugins: [
    DynamicImportRetryPlugin({
      include: /\.(js|ts|vue|tsx)$/,
      retries: 3,
    }),
  ],
})
```

### Configuration Options

| Option   | Type                                      | Description                                                   |
|----------|-------------------------------------------|---------------------------------------------------------------|
| include  | string \| RegExp \| (string \| RegExp)[]  | Files to include, default is `\.(js\|ts\|vue\|tsx)$`.          |
| exclude  | string \| RegExp \| (string \| RegExp)[]  | Files to exclude.                                              |
| retries  | number                                    | Number of retry attempts, default is `3`.                      |
