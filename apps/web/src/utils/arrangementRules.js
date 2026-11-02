export const ARRANGEMENT_STEM_LIMITS = {
  bouquet: 24,
  box: 9,
  boxed: 9,
  vase: 12,
}

export const ARRANGEMENT_STYLE_LABELS = {
  bouquet: "Bouquet",
  box: "Boxed arrangement",
  boxed: "Boxed arrangement",
  vase: "Vase arrangement",
}

export function normalizeArrangementStyle(style) {
  const value = String(style || "bouquet").trim().toLowerCase()
  if (["box", "boxed", "boxed arrangement"].includes(value)) return "box"
  if (["vase", "vase arrangement"].includes(value)) return "vase"
  return "bouquet"
}

export function getArrangementStemLimit(style) {
  return ARRANGEMENT_STEM_LIMITS[normalizeArrangementStyle(style)] || ARRANGEMENT_STEM_LIMITS.bouquet
}

export function getArrangementStyleLabel(style) {
  return ARRANGEMENT_STYLE_LABELS[normalizeArrangementStyle(style)] || ARRANGEMENT_STYLE_LABELS.bouquet
}

export function getArrangementVisualRule(style) {
  const normalized = normalizeArrangementStyle(style)

  if (normalized === "box") {
    return "Straight overhead product photograph, camera directly above the acrylic box looking vertically down at 90 degrees. Square rim parallel to the image edges, all four corners visible. Exactly nine planting holes in a 3 by 3 grid on ONE horizontal plane. Show only the selected flower heads facing upward at their assigned holes; unoccupied holes remain empty. Stems are hidden beneath the heads from this angle. Clear acrylic rim and subtle transparent lid reflections, thin red base visible only through gaps. No fillers, greenery, additional blooms, shelves, bow, wrapping, front view, side view, or tilted perspective. White studio background."
  }

  if (normalized === "vase") {
    return (
      "Show an upright vase arrangement from eye level with the full vase visible, balanced fresh stems standing naturally inside the vase, and the whole arrangement centered on a clean white studio background. " +
      "Do not show bouquet wrapping, an acrylic flower box, basket, top-down flat lay, or loose flowers outside the vase."
    )
  }

  return (
    "Show a full upright hand-tied bouquet centered on a clean white studio background, photographed from a front eye-level florist product view with a very slight high angle so the flower cluster is visible. " +
    "Use layered folded wrapping paper flaring outward around the blooms, with a large decorative bow tied at the front lower center. " +
    "The bouquet should have a rounded full flower head cluster at the top, visible fillers and greenery between blooms, and a wrapped stem bundle tapering downward below the bow. " +
    "Keep the whole bouquet visible from flower tips to bottom wrap. Do not show a vase, acrylic box, basket, top-down flat lay, or loose flowers outside the wrapper."
  )
}
