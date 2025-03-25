import { expect, test } from 'vitest'
import { build, preview } from 'vite'
import { resolve } from 'node:path'

import { browserLogs, page } from '../../vitestSetup'

import type { InlineConfig } from 'vite'
import { loadConfigFromFile } from 'vite'
import { beforeAll } from 'vitest'

let viteTestUrl: string
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

test('should work with @rollup/plugin-dynamic-import-vars', async () => {
  let loadCount = 0
  const attempts = 2
  await page.route(
    (url) => url.pathname.includes('en-') && url.pathname.includes('.js'),
    route => {
      loadCount++
      if (loadCount < attempts) {
        return route.fulfill({ status: 404, body: 'Not Found' })
      }
      return route.continue()
    },
  )
  await page.click('#btn-vars')
  await page.waitForTimeout(getJsTimeout(attempts))
  const log = browserLogs.find(log => log.includes('{title: Hello World}'))
  expect(loadCount).toBe(attempts)
  expect(log).toBeDefined()
})
