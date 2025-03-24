import { defineConfig } from 'vitest/config'

const timeout = process.env.CI ? 50000 : 30000

process.env.NODE_ENV = process.env.VITE_TEST_BUILD
  ? 'production'
  : 'development'

export default defineConfig({
  test: {
    include: ['./playground/**/*.spec.[tj]s'],
    setupFiles: ['./playground/vitestSetup.ts'],
    globalSetup: ['./playground/vitestGlobalSetup.ts'],
    testTimeout: timeout,
    hookTimeout: timeout,
    reporters: 'dot',
    onConsoleLog(log) {
      if (log.match(/experimental|jit engine|emitted file|tailwind/i))
        return false
    },
  },
})
