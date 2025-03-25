import { beforeAll, expect, test } from 'vitest'
import { build, preview, loadConfigFromFile } from 'vite'
import { resolve } from 'node:path'

import { page, browserErrors, browserLogs } from '../../vitestSetup'
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
const getCssTimeout = (retries: number) => {
  let t = testDelay
  for (let i = 0; i < retries; i++) {
    t += (1 + i) * 200
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

test('should dynamic import module successful', async () => {
  await page.click('#nav-about')
  await page.waitForTimeout(testDelay)
  expect(await page.textContent('h2')).toMatch('AboutView')
})

test('should retry when dynamic import failed', async () => {
  await page.goto(viteTestUrl)
  let retries = 0
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.js'),
    route => {
      retries++
      if (retries < maxAttempts) {
        return route.fulfill({ status: 404, body: 'Not Found' })
      }
      return route.continue()
    },
  )
  await page.click('#nav-about')
  await page.waitForTimeout(getJsTimeout(maxAttempts))
  expect(await page.textContent('h2')).toMatch('AboutView')
  expect(retries).toBe(maxAttempts)
})

test('should has an error when reach max attempts on dynamic import', async () => {
  await page.goto(viteTestUrl)
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.js'),
    route => route.fulfill({ status: 404, body: 'Not Found' }),
  )
  await page.click('#nav-about')
  await page.waitForTimeout(getJsTimeout(maxAttempts))
  const e = browserLogs.find(m => m.includes('TypeError: Failed to fetch dynamically imported module'))
  expect(e).toBeDefined()

  // can be recovered when network is available
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.js'),
    route => route.continue(),
  )
  await page.click('#nav-about')
  await page.waitForTimeout(getJsTimeout(1))
  expect(await page.textContent('h2')).toMatch('AboutView')
})

test('should retry when preload css failed', async () => {
  await page.goto(viteTestUrl)
  expect(await page.$eval('h2', (el) => getComputedStyle(el).color)).toBe('rgb(255, 0, 0)')
  let retries = 0
  const attempts = 2
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.css'),
    route => {
      retries++
      if (retries < attempts) {
        return route.fulfill({ status: 404, body: 'Not Found' })
      }
      return route.continue()
    },
  )
  await page.click('#nav-about')
  await page.waitForTimeout(getJsTimeout(attempts))
  expect(await page.textContent('h2')).toMatch('AboutView')
  expect(await page.$eval('h2', (el) => getComputedStyle(el).color)).toBe('rgb(0, 0, 255)')
  expect(retries).toBe(attempts)
})

test('should has an error when reach max attempts on preload css', async () => {
  await page.goto(viteTestUrl)
  expect(await page.$eval('h2', (el) => getComputedStyle(el).color)).toBe('rgb(255, 0, 0)')
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.css'),
    route => route.fulfill({ status: 404, body: 'Not Found' }),
  )
  await page.click('#nav-about')
  await page.waitForTimeout(getCssTimeout(maxAttempts))
  expect(await page.textContent('h2')).toMatch('AboutView')
  // should be the default body color
  expect(await page.$eval('h2', (el) => getComputedStyle(el).color)).toBe('rgb(0, 0, 0)')
  const e = browserErrors.find(e => e.message.includes('[preload-css-retried]'))
  expect(e).toBeDefined()
})
