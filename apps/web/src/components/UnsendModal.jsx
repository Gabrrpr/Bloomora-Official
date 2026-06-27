export default function UnsendModal({ isOpen, onClose, onUnsendEveryone, onUnsendForYou, isDark }) {
  if (!isOpen) return null;

  const bg        = isDark ? "#1e293b" : "#ffffff";
  const text      = isDark ? "#f1f5f9" : "#111827";
  const subText   = isDark ? "#94a3b8" : "#6b7280";
  const border    = isDark ? "#334155" : "#e5e7eb";
  const rowHover   = isDark ? "rgba(148,163,184,0.12)" : "#f3f4f6";
  const dangerHover = isDark ? "rgba(239,68,68,0.14)" : "#fef2f2";
  const danger     = isDark ? "#f87171" : "#dc2626";
  const iconBg     = isDark ? "rgba(248,113,113,0.16)" : "#fee2e2";
  const cancelBg   = isDark ? "rgba(148,163,184,0.12)" : "#f3f4f6";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-4">
          <div
            className="flex items-center justify-center rounded-full mb-3"
            style={{ width: 48, height: 48, backgroundColor: iconBg }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <h3 className="font-bold text-lg leading-tight" style={{ color: text }}>Unsend message?</h3>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: subText }}>
            Choose who you want to remove this message for. This can't be undone.
          </p>
        </div>

        {/* Options */}
        <div className="px-3 pb-2 flex flex-col gap-1">
          <button
            onClick={onUnsendEveryone}
            className="w-full text-left p-3 rounded-xl transition-colors"
            style={{ color: danger }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = dangerHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <p className="font-semibold text-sm">Unsend for everyone</p>
            <p className="text-xs mt-0.5" style={{ color: subText }}>Removes this message for everyone in the chat.</p>
          </button>

          <button
            onClick={onUnsendForYou}
            className="w-full text-left p-3 rounded-xl transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = rowHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <p className="font-semibold text-sm" style={{ color: text }}>Unsend for you</p>
            <p className="text-xs mt-0.5" style={{ color: subText }}>Removes this message from your device only.</p>
          </button>
        </div>

        {/* Cancel */}
        <div className="px-3 pb-3 pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 font-bold text-sm rounded-xl transition-colors"
            style={{ color: text, backgroundColor: cancelBg }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
