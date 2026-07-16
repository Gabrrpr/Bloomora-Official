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
      "Use an Esting's-style transparent acrylic preservation cube flower box, matching a real florist product photo: a clear square acrylic box with a flat transparent lid, thick clear edges, visible front wall, visible right/left side wall, and a red or rose-tinted base insert. " +
      "Use a slight high front three-quarter angle so the lid surface, front wall, side wall, and lower base are all visible, but keep the cube upright and level, not diamond-shaped, not rotated, not tilted, not hexagonal, and not a cardboard gift box. " +
      "The selected flowers must be inside the clear acrylic box in a neat compact grid, like 6 to 9 bloom heads sitting just below the lid. Show short green stems continuing downward through circular holes in an inner clear acrylic tray. " +
      "Add a small oval florist label on the front panel with no readable text. Do not add ribbon, wrapping paper, hand-tied stems, vase, basket, bouquet shape, flowers outside the acrylic box, or flowers rising above the lid."
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
