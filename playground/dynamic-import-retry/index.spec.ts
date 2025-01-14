import { beforeAll, expect, test } from 'vitest'
import { resolve } from 'node:path'
import type { InlineConfig } from 'vite'
import { build, preview } from 'vite'

import { page, browserErrors, browserLogs } from '../vitestSetup'

const root = resolve(__dirname, 'vue-router')

let viteTestUrl: string

beforeAll(async () => {
  const testConfig: InlineConfig = {
    configFile: resolve(root, 'vite.config.ts'),
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

const resources = ['css', 'js']

for (const resourceType of resources) {
  const filter = (url: URL) => url.pathname.includes('AboutView') && url.pathname.includes(`.${resourceType}`)

  test('should recover by retrying import ' + resourceType, async () => {
    await page.goto(viteTestUrl)

    let retries = 0
    await page.route(filter, route => {
      retries++
      if (retries < 3) {
        return route.fulfill({ status: 404, body: 'Not Found' })
      }
      return route.continue()
    })
    await page.click('#nav-about')
    await page.waitForTimeout(1000)
    expect(await page.textContent('h2')).toMatch('AboutView')
    expect(retries).toBe(3)
  })

  test('should has an error when reach max attempts on loading ' + resourceType, async () => {
    await page.goto(viteTestUrl)

    await page.route(filter, route => {
      return route.fulfill({ status: 404, body: 'Not Found' })
    })
    await page.click('#nav-about')
    await page.waitForTimeout(1500)

    if (resourceType === 'js') {
      expect(await page.textContent('h2')).toMatch('HomeView')
    }

    if (resourceType === 'css') {
      const e = browserErrors.find(e => e.message.includes('[preload-css-retried]'))
      expect(e).toBeDefined()
    } else {
      const e = browserLogs.find(l => l.includes('[dynamic-import-retry]'))
      expect(e).toBeDefined()
    }
  })
}

