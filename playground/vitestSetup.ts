import { join } from 'node:path'
import os from 'node:os'
import fs from 'fs-extra'
import { chromium } from 'playwright-chromium'
import type { Browser, Page } from 'playwright-chromium'
import { beforeAll } from 'vitest'

export const browserErrors: Error[] = []
export const browserLogs: string[] = []

export let page: Page = undefined!
export let browser: Browser = undefined!

const DIR = join(os.tmpdir(), 'vitest_playwright_global_setup')

beforeAll(async () => {
  const wsEndpoint = fs.readFileSync(join(DIR, 'wsEndpoint'), 'utf-8')
  if (!wsEndpoint) {
    throw new Error('wsEndpoint not found')
  }

  browser = await chromium.connect(wsEndpoint)
  page = await browser.newPage()

  page.on('console', (msg) => {
    // ignore favicon request in headed browser
    if (
      process.env.VITE_DEBUG_SERVE &&
      msg.location().url.includes('favicon.ico')
    ) {
      return
    }
    browserLogs.push(msg.text())
  })

  page.on('pageerror', (error) => {
    browserErrors.push(error)
  })

  return async () => {
    await page?.close()
    if (browser) {
      await browser.close()
    }
  }
})
