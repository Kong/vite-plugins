import { defineBuildConfig } from 'unbuild'

// https://github.com/unjs/unbuild?tab=readme-ov-file#configuration
export default defineBuildConfig({
  name: '@kong/vite-plugins',
  // Each separate plugin's entry file should be listed here
  entries: [
    './src/plugin-example-one/index.ts',
  ],
  // Generates .d.ts declaration file(s)
  declaration: true,
  // Clean the output directory before building
  clean: true,
})
