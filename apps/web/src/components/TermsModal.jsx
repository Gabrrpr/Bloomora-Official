import { useEffect, useRef } from "react"

/**
 * TermsModal — popup version of the Terms & Conditions page.
 * Used in Register.jsx so the user can review T&C without losing their form progress.
 *
 * Props:
 *   open        - boolean: controls visibility
 *   onClose     - () => void
 *   onAgree     - () => void  (called when user clicks "I Agree" inside the modal; optional)
 */
export default function TermsModal({ open, onClose, onAgree }) {
  const dialogRef = useRef(null)

  // Lock body scroll while open + handle ESC
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e) => { if (e.key === "Escape") onClose?.() }
    window.addEventListener("keydown", onKey)
    // Focus the dialog for accessibility
    setTimeout(() => dialogRef.current?.focus(), 50)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 bg-black/50 backdrop-blur-sm animate-[fadeIn_.18s_ease-out]"
      aria-modal="true"
      role="dialog"
      aria-labelledby="terms-modal-title"
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden outline-none animate-[slideUp_.22s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="terms-modal-title" className="text-lg font-bold text-gray-800">
                Terms &amp; Conditions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Esting's Flower International Inc. · Bloomora
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-gray-700 leading-relaxed space-y-5">
          <p className="text-xs text-gray-400">Last updated: May 2026</p>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">1. Acceptance of Terms</h3>
            <p>
              By creating an account, browsing, or purchasing from Bloomora (operated by Esting's Flower
              International Inc.), you agree to be bound by these Terms &amp; Conditions and our Privacy
              Policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">2. Account Registration</h3>
            <p>
              You must provide accurate, current, and complete information during registration and keep
              it updated. You are responsible for safeguarding your password and all activities under
              your account. Notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">3. Orders &amp; Payment</h3>
            <p>
              All orders are subject to acceptance and product availability. Prices are in Philippine
              Pesos (PHP) and may change without notice. We reserve the right to refuse or cancel any
              order at our discretion, including for suspected fraud or pricing errors.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">4. Delivery</h3>
            <p>
              Delivery times are estimates and not guaranteed. Same-day delivery requires orders placed
              before 2:00 PM (Philippine Standard Time). Delivery fees vary by location. We are not
              liable for delays caused by incorrect addresses, weather, traffic, or recipient
              unavailability.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">5. Returns &amp; Refunds</h3>
            <p>
              Due to the perishable nature of fresh flowers, all sales are final. Issues with quality
              must be reported within 24 hours of delivery with photo evidence. Refunds or replacements
              are granted at our sole discretion. Refer to our Return Policy for full details.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">6. User Conduct</h3>
            <p>
              You agree not to misuse our services, including (but not limited to) submitting false
              information, attempting to gain unauthorized access, or interfering with other users'
              experience.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">7. Intellectual Property</h3>
            <p>
              All content on Bloomora — including images, designs, logos, and text — is the property of
              Esting's Flower International Inc. and protected by Philippine and international
              copyright laws. You may not reproduce, distribute, or use any content without written
              permission.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">8. Privacy</h3>
            <p>
              Your personal information is handled in accordance with our Privacy Policy and the Data
              Privacy Act of 2012 (Republic Act No. 10173). We collect only what is necessary to
              fulfill your orders and improve your experience.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">9. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Esting's Flower International Inc. shall not be
              liable for any indirect, incidental, or consequential damages arising from your use of
              our services.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">10. Changes to Terms</h3>
            <p>
              We may update these Terms from time to time. Continued use of our services after changes
              are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">11. Contact</h3>
            <p>
              For questions about these Terms, contact us via our official channels listed on the
              Contact page.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition"
          >
            Close
          </button>
          {onAgree && (
            <button
              type="button"
              onClick={() => { onAgree(); onClose?.() }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-xl transition"
            >
              I Agree
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
