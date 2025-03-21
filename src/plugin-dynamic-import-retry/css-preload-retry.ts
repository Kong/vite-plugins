interface VitePreloadErrorEvent extends Event {
  payload: Error
}

/**
 * This function will be stringified and injected into html.
 * Make sure everything is literally inlined, no imports or external references.
 */
export function createCSSPreloadRetry(options = { retries: 3 }) {
  // error message: `Unable to preload CSS for /gateway-manager/assets/GatewayOverviewPage.BwFrm_fH.css`
  // https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/plugins/importAnalysisBuild.ts#L141
  const pathRegex = /\s([^\s]+\.css)/

  // extract the css path from vite error message
  function parseMessageBody(message: string) {
    const [, cssPath] = message.match(pathRegex) || []
    return cssPath || null
  }

  function loadCSS(path: string) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = path
      link.crossOrigin = 'anonymous'
      link.onload = resolve
      link.onerror = reject
      document.head.appendChild(link)
    })
  }

  async function handleVitePreloadError(e: VitePreloadErrorEvent) {
    if (!e.payload?.message || !e.payload.message.includes('Unable to preload CSS')) return
    const cssPath = parseMessageBody(e.payload.message)
    if (!cssPath) {
      console.error('[preload-css-parse-failure]', e.payload.message)
      return
    }
    e.preventDefault() // mute the original error
    for (let i = 0; i < options.retries; i++) {
      try {
        const cacheBustedPath = `${cssPath}?t=${+new Date()}`
        await loadCSS(cacheBustedPath)
        return
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
      // avoid to create same timestamp for the next retry
        await new Promise((resolve) => setTimeout(resolve, (1 + i) * 200))
      }
    }
    throw new Error(`[preload-css-retried] ${e.payload.message}`)
  }

  // the event is emitted by vite
  // https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/plugins/importAnalysisBuild.ts#L150
  window.addEventListener('vite:preloadError', handleVitePreloadError as any)
}
