type RouteProgressListener = (state: { progress: number; visible: boolean }) => void

const listeners = new Set<RouteProgressListener>()

let progress = 0
let visible = false
let trickleTimer = 0

function notify() {
  const snapshot = { progress, visible }
  listeners.forEach((listener) => listener(snapshot))
}

function clearTrickle() {
  if (trickleTimer) {
    window.clearTimeout(trickleTimer)
    trickleTimer = 0
  }
}

function trickle() {
  clearTrickle()
  if (!visible || progress >= 92) return
  trickleTimer = window.setTimeout(() => {
    progress = Math.min(92, progress + 4 + Math.random() * 10)
    notify()
    trickle()
  }, 140)
}

export function subscribeRouteProgress(listener: RouteProgressListener) {
  listeners.add(listener)
  listener({ progress, visible })
  return () => listeners.delete(listener)
}

export function startRouteProgress() {
  clearTrickle()
  progress = 8
  visible = true
  notify()
  trickle()
}

export function finishRouteProgress() {
  clearTrickle()
  progress = 100
  notify()
  window.setTimeout(() => {
    visible = false
    progress = 0
    notify()
  }, 320)
}
