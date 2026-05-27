export default function UnsendModal({ isOpen, onClose, onUnsendEveryone, onUnsendForYou, isDark }) {
  if (!isOpen) return null;
  const bg = isDark ? "#1e293b" : "white";
  const text = isDark ? "#f1f5f9" : "#1f2937";
  const subText = isDark ? "#94a3b8" : "#6b7280";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" style={{ backgroundColor: bg }}>
        <div className="p-5 border-b" style={{ borderColor: isDark ? "#334155" : "#e5e7eb" }}>
          <h3 className="font-bold text-lg" style={{ color: text }}>Unsend message?</h3>
        </div>
        <div className="p-2">
          <button onClick={onUnsendEveryone} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <p className="font-semibold text-sm" style={{ color: text }}>Unsend for everyone</p>
            <p className="text-xs mt-1" style={{ color: subText }}>Removes message for everyone in the chat.</p>
          </button>
          <button onClick={onUnsendForYou} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <p className="font-semibold text-sm" style={{ color: text }}>Unsend for you</p>
            <p className="text-xs mt-1" style={{ color: subText }}>Removes message from your device only.</p>
          </button>
        </div>
        <div className="p-4 border-t" style={{ borderColor: isDark ? "#334155" : "#e5e7eb" }}>
          <button onClick={onClose} className="w-full py-2 font-bold text-sm" style={{ color: subText }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}