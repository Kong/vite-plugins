import { expect, test } from 'vitest'
import { build, preview } from 'vite'
import { resolve } from 'node:path'

import { browserLogs, page } from '../../vitestSetup'

import type { InlineConfig } from 'vite'
import { loadConfigFromFile } from 'vite'
import { beforeAll } from 'vitest'

let viteTestUrl: string

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
  await page.route(
    (url) => url.pathname.includes('en-') && url.pathname.includes('.js'),
    route => {
      loadCount++
      if (loadCount < 2) {
        return route.fulfill({ status: 404, body: 'Not Found' })
      }
      return route.continue()
    },
  )
  await page.click('#btn-vars')
  await page.waitForTimeout(1000)
  const log = browserLogs.find(log => log.includes('{title: Hello World}'))
  expect(loadCount).toBe(2)
  expect(log).toBeDefined()
})
