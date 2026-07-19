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
    return (
      "Use a premium transparent acrylic florist display box matching this physical construction: a straight, upright square-footprint case with clear vertical walls, a shallow transparent upper cover around the flower heads, a clear horizontal support plate at mid-height, and a flat deep rose-red base. " +
      "Place exactly the customer's selected number of bloom heads in a compact, evenly spaced grid in the upper half. The flower heads should nearly fill the upper compartment while remaining below the clear cover. Show each short green stem passing downward through its own round hole in the clear support plate and visibly continuing into the empty lower compartment. " +
      "Photograph the whole box from a slightly elevated front three-quarter angle so the top cover, front wall, one side wall, support plate, stems, and red base are simultaneously visible. Keep all edges straight, parallel, upright, and rectangular. Add a small blank oval florist label centered low on the front wall. " +
      "This is a rigid acrylic flower display case, not a cardboard gift box, vase, basket, terrarium, jewelry box, hand-tied bouquet, tilted diamond, or solid glass block. Do not add ribbon, wrapping paper, extra flowers, readable text, flowers outside the case, or flowers above the cover."
    )
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
