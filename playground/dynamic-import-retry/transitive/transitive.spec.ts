import { expect, test } from 'vitest'
import { build, preview } from 'vite'
import { resolve } from 'node:path'

import { browserLogs, page } from '../../vitestSetup'
import { defaultOptions } from '../../../src/plugin-dynamic-import-retry/index'

import type { InlineConfig } from 'vite'
import { loadConfigFromFile } from 'vite'
import { beforeAll } from 'vitest'

let viteTestUrl: string
const maxAttempts = defaultOptions.retries!
const testDelay = 100 // delay for the test to take effect
const getJsTimeout = (retries: number) => {
  let t = testDelay
  for (let i = 0; i < retries; i++) {
    t += 1000 * 2 ** (i - 1)
  }
  return t
}

beforeAll(async () => {
  const res = await loadConfigFromFile(
    {
      command: 'build',
      mode: 'production',
    },
    undefined,
    resolve(__dirname),
  )
  if (!res) throw new Error('Failed to load config')

  const testConfig: InlineConfig = {
    ...res.config,
    logLevel: 'silent',
    configFile: false,
  }

  await build(testConfig)
  const previewServer = await preview(testConfig)

  viteTestUrl = previewServer.resolvedUrls!.local[0]
  await page.goto(viteTestUrl)

  return async () => {
    previewServer.close()
  }
})

test('should not work on transitive import', async () => {
  let subModuleLoadCount = 0
  let entryModuleLoadCount = 0
  await page.route(
    (url) => url.pathname.includes('simple') && url.pathname.includes('.js'),
    route => {
      subModuleLoadCount++
      return route.fulfill({ status: 404, body: 'Not Found' })
    },
  )
  await page.route(
    (url) => url.pathname.includes('transitive') && url.pathname.includes('.js'),
    route => {
      entryModuleLoadCount++
      return route.continue()
    },
  )
  await page.click('#btn-transitive')
  await page.waitForTimeout(getJsTimeout(maxAttempts))
  expect(entryModuleLoadCount).toBe(4)
  expect(subModuleLoadCount).toBe(1)
  const e = browserLogs.find(m => m.includes('TypeError: Failed to fetch dynamically imported module'))
  expect(e).toBeDefined()
})
