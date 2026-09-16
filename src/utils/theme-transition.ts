const DURATION_MS = 700
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function supportsViewTransition() {
  return typeof document.startViewTransition === 'function'
}

function readToggleOrigin() {
  const el = document.querySelector('.theme-toggle') as HTMLElement | null
  if (el) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 || rect.height > 0) {
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      }
    }
  }

  return {
    x: Math.round(Math.max(64, window.innerWidth - 140)),
    y: 36,
  }
}

/**
 * Inject keyframes with viewport-percentage coordinates.
 * Avoids Chrome's large-px clip-path circle glitch on the first transition.
 */
function installRippleKeyframes(x: number, y: number) {
  const styleId = 'theme-ripple-keyframes'
  document.getElementById(styleId)?.remove()

  const xPercent = ((x / Math.max(window.innerWidth, 1)) * 100).toFixed(3)
  const yPercent = ((y / Math.max(window.innerHeight, 1)) * 100).toFixed(3)

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    html.theme-rippling::view-transition-old(root) {
      z-index: 1;
      animation: none;
      mix-blend-mode: normal;
      display: block;
    }
    html.theme-rippling::view-transition-new(root) {
      z-index: 2147483646;
      animation: theme-ripple-reveal ${DURATION_MS}ms ${EASING} both;
      mix-blend-mode: normal;
      display: block;
    }
    @keyframes theme-ripple-reveal {
      from { clip-path: circle(0% at ${xPercent}% ${yPercent}%); }
      to { clip-path: circle(150% at ${xPercent}% ${yPercent}%); }
    }
  `
  document.head.appendChild(style)
  return style
}

export async function runThemeTransition(applyTheme: () => void | Promise<void>): Promise<void> {
  if (prefersReducedMotion() || !supportsViewTransition()) {
    await applyTheme()
    return
  }

  const { x, y } = readToggleOrigin()
  const styleEl = installRippleKeyframes(x, y)
  const root = document.documentElement
  root.classList.add('theme-rippling')

  try {
    const transition = document.startViewTransition(async () => {
      await applyTheme()
    })
    await transition.finished
  } catch {
    // Transition skipped/cancelled; theme may already be applied.
  } finally {
    root.classList.remove('theme-rippling')
    window.setTimeout(() => styleEl.remove(), 50)
  }
}
