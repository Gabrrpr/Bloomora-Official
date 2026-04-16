const G = "#2E8B34"

const ORDER = {
  date: "Feb 12 2026",
  txn: "TRX-000118",
  payment: "QR PH",
  items: [
    { name: "China Red Roses (Customized)", qty: 1, price: 2300, imgLabel: "China Red Roses" },
    { name: "Blush Elegance Ecuador Roses (Customized)", qty: 1, price: 2720, imgLabel: "Blush Ecuador" },
  ],
  address: { name: "Juan dela Cruz", addr: "60 Friendship Highway, Clark Freeport Zone, Pampanga, Angeles City, 2009", phone: "+63 0987 654 3210", email: "juandelacruz@gmail.com" },
  delivery: "February 13 (GMT+8), anytime within the day.",
  shipping: 100,
}

export default function Confirmation({ onNavigate }) {
  const subtotal = ORDER.items.reduce((s, i) => s + i.price * i.qty, 0)
  const total = subtotal + ORDER.shipping

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* Left — thank you */}
          <div>
            <h1 className="text-4xl font-bold text-gray-800 leading-tight mb-4">
              Thank you for your<br />purchase!
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Your order has been confirmed and is currently in preparation.<br />
              It will be delivered on <strong className="text-gray-700">February 13 (GMT+8)</strong>, anytime within the day.
            </p>

            {/* Billing */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Billing Address</h2>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Name", value: ORDER.address.name },
                  { label: "Address", value: ORDER.address.addr },
                  { label: "Phone no.", value: ORDER.address.phone },
                  { label: "Email", value: ORDER.address.email },
                ].map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-gray-400 font-medium">{label}</span>
                    <span className="text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate("orders")}
              className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105"
              style={{ backgroundColor: G }}
            >
              Track Your Order
            </button>
          </div>

          {/* Right — receipt style */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Order Summary</h2>
            </div>

            {/* Meta row */}
            <div className="px-5 py-3 grid grid-cols-3 gap-3 border-b border-gray-100">
              {[
                { label: "Order date", value: ORDER.date },
                { label: "Transaction number", value: ORDER.txn },
                { label: "Payment Method", value: ORDER.payment },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-gray-700">{value}</p>
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="px-5 divide-y divide-gray-100">
              {ORDER.items.map((item, i) => (
                <div key={i} className="py-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-50 to-rose-100 flex-shrink-0 flex items-center justify-center border border-gray-100">
                    <span className="text-xs text-gray-400 text-center leading-tight px-1">{item.imgLabel}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.qty}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 flex-shrink-0">₱{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal ({ORDER.items.length} items)</span><span>₱{subtotal.toLocaleString()}.00</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>Shipping Fee</span><span>₱{ORDER.shipping}.00</span></div>
              <div className="flex justify-between text-base font-bold text-gray-800 pt-1 border-t border-gray-100 mt-1">
                <span>Order total</span>
                <span>₱{total.toLocaleString()}.00</span>
              </div>
              <p className="text-xs text-gray-400">VAT included, where applicable</p>
            </div>

            {/* Receipt tear edge decoration */}
            <div className="px-5">
              <div className="border-t border-dashed border-gray-200 relative overflow-hidden">
                <div className="flex justify-between -mx-5">
                  {Array.from({length: 14}).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gray-100 -mt-1.5 flex-shrink-0" />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
