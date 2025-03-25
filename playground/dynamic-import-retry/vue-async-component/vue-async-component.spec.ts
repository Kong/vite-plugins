import { beforeAll, expect, test } from 'vitest'
import { build, preview, loadConfigFromFile } from 'vite'
import { resolve } from 'node:path'

import { page } from '../../vitestSetup'
import { defaultOptions } from '../../../src/plugin-dynamic-import-retry/index'

import type { InlineConfig } from 'vite'

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

  return async () => {
    previewServer.close()
  }
})

test('should loading component displayed', async () => {
  await page.goto(viteTestUrl)
  await page.waitForTimeout(200)
  expect(await page.textContent('#app')).toMatch('Loading...')
  await page.waitForTimeout(500)
  expect(await page.textContent('#app')).toMatch('Hello, World!')
})

test('should error component displayed when timeout', async () => {
  await page.goto(`${viteTestUrl}?timeout=1`)
  expect(await page.textContent('#app')).toMatch('Error')
})

test('should recover when dynamic import failed', async () => {
  await page.goto(`${viteTestUrl}?latency=0`)
  let retries = 0
  const attempts = 2
  await page.route(
    (url) => url.pathname.includes('HelloWorld') && url.pathname.includes('.js'),
    route => {
      retries++
      if (retries < attempts) {
        return route.fulfill({ status: 404, body: 'Not Found' })
      }
      return route.continue()
    },
  )
  await page.waitForTimeout(getJsTimeout(attempts))
  expect(await page.textContent('#app')).toMatch('Hello, World!')
  expect(retries).toBe(attempts)
})

test('should display error when reach max attempts on dynamic import', async () => {
  await page.goto(`${viteTestUrl}?latency=0&timeout=${getJsTimeout(maxAttempts) / 2}`)
  await page.route(
    (url) => url.pathname.includes('HelloWorld') && url.pathname.includes('.js'),
    route => route.fulfill({ status: 404, body: 'Not Found' }),
  )
  await page.waitForTimeout(getJsTimeout(maxAttempts))
  expect(await page.textContent('#app')).toMatch('Error')
})
