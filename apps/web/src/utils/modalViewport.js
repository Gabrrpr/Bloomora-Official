export function getTopNavigationInset() {
  if (typeof window === "undefined" || typeof document === "undefined") return 72

  const viewportHeight = window.visualViewport?.height || window.innerHeight || 800
  let navigationBottom = 0
  const candidates = document.querySelectorAll(
    "nav, header, [data-navbar], [class*='navbar' i]",
  )

  candidates.forEach(element => {
    const style = window.getComputedStyle(element)
    if (style.display === "none" || style.visibility === "hidden") return
    const rect = element.getBoundingClientRect()
    if (rect.top <= 8 && rect.bottom > 24 && rect.bottom < viewportHeight - 64) {
      navigationBottom = Math.max(navigationBottom, rect.bottom)
    }
  })

  return Math.ceil((navigationBottom || 64) + 8)
}
