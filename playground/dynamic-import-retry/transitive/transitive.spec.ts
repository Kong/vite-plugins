import { expect, test } from 'vitest'
import { build, preview } from 'vite'
import { resolve } from 'node:path'

import { browserErrors, page } from '../../vitestSetup'

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
  await page.waitForTimeout(2000)
  expect(entryModuleLoadCount).toBe(4)
  expect(subModuleLoadCount).toBe(1)
  const e = browserErrors.find(e => e.message.includes('[dynamic-import-retry]') && e.message.includes('transitive'))
  expect(e).toBeDefined()
})
