import type { HtmlTagDescriptor, Plugin } from 'vite'
import { simple } from 'acorn-walk'
import MagicString from 'magic-string'
import { createFilter } from '@rollup/pluginutils'

import { createCSSPreloadRetry } from './css-preload-retry'
import { createImportWrapper } from './import-wrapper'

const dynamicImportPrefixRE = /import\s*\(/

export type Options = {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]
  retries?: number
}

export const defaultOptions: Options = {
  include: /\.(js|ts|vue|tsx)$/,
  exclude: /node_modules/,
  retries: 3,
}
export function DynamicImportRetryPlugin(opt?: Options): Plugin {
  const options = { ...defaultOptions, ...opt }
  const virtualModuleId = 'virtual:dynamic-import-retry'
  const resolvedVirtualModuleId = '\0' + virtualModuleId
  const filter = createFilter(options.include, options.exclude)

  return {
    name: 'dynamic-import-retry',
    apply: 'build',

    transformIndexHtml() {
      const descriptor: HtmlTagDescriptor[] = [
        {
          tag: 'script',
          children: `(${createCSSPreloadRetry.toString()}({ retries: ${options.retries} }))`,
          injectTo: 'head-prepend',
        },
      ]
      return descriptor
    },

    transform(code, id) {
      if (!filter(id) || !dynamicImportPrefixRE.test(code)) {
        return null
      }

      const parsed = this.parse(code)

      let ms: MagicString | undefined

      simple(parsed, {
        ImportExpression(node) {
          ms = ms || new MagicString(code)
          const start = node.start
          const end = node.end
          const path = code.slice(node.source.start, node.source.end)
          ms.overwrite(start, end, `importWrapper(() => import(${path}))()`)
        },
      })

      if (ms) {
        ms.prepend(`import { importWrapper } from '${virtualModuleId}'\n`)

        return {
          code: ms.toString(),
          map: ms.generateMap({
            file: id,
            includeContent: true,
            hires: true,
          }),
        }
      }

      return null
    },

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `${createImportWrapper.toString()}
const importWrapper = createImportWrapper({ retries: ${options.retries} })
export { importWrapper }`
      }
    },
  }
}
