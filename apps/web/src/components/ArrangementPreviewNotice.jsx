export default function ArrangementPreviewNotice({ isDark }) {
  return (
    <aside aria-label="About your arrangement preview"
      className="mx-4 sm:mx-7 mb-4 rounded-xl border border-l-4 px-4 py-3"
      style={{ backgroundColor: isDark ? "#302614" : "#fffbeb", borderColor: isDark ? "#d99b20" : "#f59e0b", color: isDark ? "#fef3c7" : "#78350f" }}>
      <div className="flex items-start gap-2.5">
        <svg aria-hidden="true" className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug">AI-generated preview</p>
          <p className="mt-1 text-sm leading-relaxed">Flower counts, colors, and placement may vary in the image. Your florist follows the items and quantities in the <strong>Cost breakdown</strong>.</p>
        </div>
      </div>
    </aside>
  )
}
