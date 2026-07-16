export const TESTING_DISCLAIMER_SESSION_KEY = "bloomora_testing_disclaimer_ack"

export default function TestingDisclaimerBanner({ compact = false, modal = false, onAccept }) {
  if (modal) {
    return (
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center px-4 py-6"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.62)", backdropFilter: "blur(6px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="testing-disclaimer-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-orange-100 overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <h2 id="testing-disclaimer-title" className="text-xl font-extrabold text-gray-900">
              Testing Website Notice
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
              <p>
                This website is for demonstration and testing only. It does not cater real transactions or real customer purchases.
              </p>
              <p>
                Please do not send real money, use real payment channels, or treat any order as an actual purchase.
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs leading-relaxed text-orange-800">
              Checkout is configured for test orders only, and no real payment should be collected.
            </div>
          </div>
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={onAccept}
              className="w-full rounded-xl bg-[#2E8B34] px-4 py-3 text-sm font-bold text-white shadow-lg hover:brightness-105 active:scale-[0.99] transition"
            >
              I understand
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? "px-4 sm:px-6 lg:px-8" : "w-full"}>
      <div
        className={`mx-auto ${compact ? "max-w-6xl rounded-2xl border" : "rounded-none border-y"} px-4 py-3`}
        style={{
          backgroundColor: "#fff7ed",
          borderColor: "#fed7aa",
          color: "#9a3412",
        }}
      >
        <div className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <p>
            <strong>Testing notice:</strong> This website is for demonstration and testing only. Please do not send real money or treat any order as a real transaction.
          </p>
        </div>
      </div>
    </div>
  )
}
