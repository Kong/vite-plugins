import { beforeAll, expect, test } from 'vitest'
import { build, preview, loadConfigFromFile } from 'vite'
import { resolve } from 'node:path'

import { page, browserErrors, browserLogs } from '../../vitestSetup'

import type { InlineConfig } from 'vite'

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

test('should dynamic import module successful', async () => {
  await page.click('#nav-about')
  await page.waitForTimeout(100)
  expect(await page.textContent('h2')).toMatch('AboutView')
})

test('should retry when dynamic import failed', async () => {
  await page.goto(viteTestUrl)
  let retries = 0
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.js'),
    route => {
      retries++
      if (retries < 3) {
        return route.fulfill({ status: 404, body: 'Not Found' })
      }
      return route.continue()
    },
  )
  await page.click('#nav-about')
  await page.waitForTimeout(1000)
  expect(await page.textContent('h2')).toMatch('AboutView')
  expect(retries).toBe(3)
})

test('should has an error when reach max attempts on dynamic import', async () => {
  await page.goto(viteTestUrl)
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.js'),
    route => route.fulfill({ status: 404, body: 'Not Found' }),
  )
  await page.click('#nav-about')
  await page.waitForTimeout(1500)
  const e = browserLogs.find(l => l.includes('[dynamic-import-retry]'))
  expect(e).toBeDefined()

  // can be recovered when network is available
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.js'),
    route => route.continue(),
  )
  await page.click('#nav-about')
  await page.waitForTimeout(200)
  expect(await page.textContent('h2')).toMatch('AboutView')
})

test('should retry when preload css failed', async () => {
  await page.goto(viteTestUrl)
  expect(await page.$eval('h2', (el) => getComputedStyle(el).color)).toBe('rgb(255, 0, 0)')
  let retries = 0
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.css'),
    route => {
      retries++
      if (retries < 2) {
        return route.fulfill({ status: 404, body: 'Not Found' })
      }
      return route.continue()
    },
  )
  await page.click('#nav-about')
  await page.waitForTimeout(500)
  expect(await page.textContent('h2')).toMatch('AboutView')
  expect(await page.$eval('h2', (el) => getComputedStyle(el).color)).toBe('rgb(0, 0, 255)')
  expect(retries).toBe(2)
})

test('should has an error when reach max attempts on preload css', async () => {
  await page.goto(viteTestUrl)
  expect(await page.$eval('h2', (el) => getComputedStyle(el).color)).toBe('rgb(255, 0, 0)')
  await page.route(
    (url) => url.pathname.includes('AboutView') && url.pathname.includes('.css'),
    route => route.fulfill({ status: 404, body: 'Not Found' }),
  )
  await page.click('#nav-about')
  await page.waitForTimeout(1500)
  expect(await page.textContent('h2')).toMatch('AboutView')
  // should be the default body color
  expect(await page.$eval('h2', (el) => getComputedStyle(el).color)).toBe('rgb(0, 0, 0)')
  const e = browserErrors.find(e => e.message.includes('[preload-css-retried]'))
  expect(e).toBeDefined()
})
