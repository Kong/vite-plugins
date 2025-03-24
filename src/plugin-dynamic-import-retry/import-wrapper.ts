/**
 * This function will be stringified and injected into bundle.
 * Make sure everything is literally inlined, no imports or external references.
 */
export function createImportWrapper(options = { retries: 3 }) {
  type ImportFn = () => Promise<any>

  const identity = (e: any) => e
  const retry = createDynamicImportWithRetry(options.retries)

  /*
  Copyright 2024 Carl-Erik Kopseng
  https://github.com/fatso83/retry-dynamic-import

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
  */
  type PositiveInteger<T extends number> = `${T}` extends
    | '0'
    | `-${any}`
    | `${any}.${any}`
    ? never
    : T

  const uriOrRelativePathRegex = /["']((\w+:(\/?\/?))?[^\s]+)["']/
  function parseModulePathFromImporterBody(importer: () => any): string | null {
    const fnString = importer.toString()
    const match = fnString.match(uriOrRelativePathRegex)
    if (!match) return null
    return match.filter(identity)[1]
  }

  function createDynamicImportWithRetry<T extends number>(
    maxRetries: PositiveInteger<T>,
    importFunction: (path: string) => Promise<any> = (path: string) => import(/* @vite-ignore */ path),
  ) {
    return async (importer: () => Promise<any>) => {
      try {
        return await importer()
      } catch (error) {
        const modulePath = parseModulePathFromImporterBody(importer)

        if (!modulePath) {
          throw error
        }

        for (let i = 0; i < maxRetries; i++) {
          // add a timestamp to the url to force a reload the module (and not use the cached version - cache busting)
          const cacheBustedPath = `${modulePath}?t=${+new Date()}`

          try {
            const result = await importFunction(cacheBustedPath)
            return result
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) {
            // avoid to create same timestamp for the next retry
            await new Promise((resolve) => setTimeout(resolve, (i + 1) * 200))
          }
        }
        throw new Error(`[dynamic-import-retry] ${error instanceof Error ? error.message = `[dynamic-import-retry] ${error.message}` : error}`)
      }
    }
  }

  return function importWrapper(importFn: ImportFn): ImportFn {
    return async function() {
      return await retry(importFn)
    }
  }
}
