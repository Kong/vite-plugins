## Directory Overview

This directory serves as a testing environment for plugins. Each subdirectory corresponds to a specific plugin, identified by its name.

* `vitestGlobalSetup.ts`: This is the global setup file for Vitest, executed once before all tests. It initializes a headless browser environment.
* `vitestSetup.ts`: This is the per-test setup file for Vitest, executed before each individual test. It provides references to the browser instance and the page context for use during testing.

## Steps to Test Your Plugin
1. Create a new subdirectory within the playground directory, using your plugin’s name as the folder name.
2. Within this folder, set up one or more Vite projects for testing.
3. Write test files with the `.spec.ts` extension to validate your plugin’s functionality.
4. If browser-based testing is required, you can import `page` or `browser` from the `vitestSetup.ts` file to interact with the headless browser environment.
