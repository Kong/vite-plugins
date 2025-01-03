# @kong/vite-plugins

Kong OSS Vite Plugins

## Installation

```shell
# pnpm
pnpm add @kong/vite-plugins

# yarn
yarn add @kong/vite-plugins

#npm
npm install @kong/vite-plugins
```

## Plugin Documentation

Each Vite plugin has its own documentation within its parent directory.

## General Usage

Each Vite plugin is exposed at an import path from the `@kong/vite-plugins` npm package and provide their own exports.

Each plugin can choose to provide a default export, or named exports. Please check the desired plugin's documentation for specific usage instructions.

```typescript
// Default export example
import KongPluginExampleOne from '@kong/vite-plugins/plugin-example-one'

// Named export example
import { getName } from '@kong/vite-plugins/plugin-example-one'
```

## Contributing

### Requirements

- Each Vite plugin **must** live in its own directory as a direct child of the `/src/` folder. No other top-level files should be placed in the `/src/` folder.
- Each Vite plugin directory and export path **should** follow the naming convention `plugin-*`. Example: `plugin-example-name`
- Plugins **must** be written in TypeScript and adhere to the configured ESLint ruleset. Additional rules may be extended as needed.
- Each plugin **must** have a `README.md` file in the directory to provide usage instructions and other information.

### Creating a Plugin

1. Add a new directory inside the `/src/` folder, named according to the syntax `plugin-{name}` where `name` is a descriptor of what the plugin does, e.g. `plugin-example-name`.

2. Add an `index.ts` file at the root of your plugin directory to serve as the entry file for your plugin.

3. Add a `README.md` file in the new plugin directory to provide usage instructions.

4. Add your plugin's entry file path to the array of `entries` in [`build.config.ts](./build.config.ts). All plugin exports (both default and named) **must** be defined in the `index.ts` file, regardless of your plugin's structure:

    ```typescript
    export default defineBuildConfig({
      entries: [
        // ...other entries
        // Add your plugin to the array, using the directory path you created above.
        './src/plugin-example-name/index.ts',
      ],
    })
    ```

5. Update the `package.json` file `exports` object for your plugin:

    ```jsonc
    {
      "exports": {
        // Substitute the directory name you created
        // for your plugin in the path for `plugin-example-name`.
        "./plugin-example-name": {
          "import": "./dist/plugin-example-name/index.mjs",
          "types": "./dist/plugin-example-name/index.d.ts"
        }
      }
    }
    ```

### Lint and fix

Lint package files, and optionally auto-fix detected issues.

```shell
# ESLint only
pnpm lint

# ESLint and fix
pnpm lint:fix
```

### Testing

Unit tests are run with [Vitest](https://vitest.dev/).

```shell
# Run tests
pnpm test

# Run tests in the Vitest UI
pnpm test:ui
```

### Build

Build for production and inspect the files in the `/dist` directory.

```shell
pnpm build
```

### Committing Changes

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

This repo uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

[Commitizen](https://github.com/commitizen/cz-cli) and [Commitlint](https://github.com/conventional-changelog/commitlint) are used to help build and enforce commit messages.

It is **highly recommended** to use the following command in order to create your commits:

```sh
pnpm run commit
```

This will trigger the Commitizen interactive prompt for building your commit message.

#### Enforcing Commit Format

[Lefthook](https://github.com/evilmartians/lefthook) is used to manage Git Hooks within the repo.

- A `commit-msg` hook is automatically setup that enforces commit message stands with `commitlint`, see [`lefthook.yaml`](./lefthook.yaml)
- A `pre-push` hook is used that runs `eslint` before allowing you to push your changes to the repository

Additionally, CI will use `commitlint` to validate the commits associated with a PR in the `Lint and Validate` job.
