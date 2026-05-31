import { useState } from "react"
import { useAuth } from "../../context/AuthContext"

export default function Settings({ onNavigate }) {
  const { logout } = useAuth()
  const [notifications, setNotifications] = useState({ email: true, sms: false, promo: true, orderUpdates: true })
  const [privacy, setPrivacy] = useState({ publicProfile: false, shareActivity: false })
  const G = "#2E8B34"

  const Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)}
      className="relative w-10 h-6 rounded-full transition-all duration-200 focus:outline-none"
      style={{ backgroundColor: checked ? G : "#d1d5db" }}>
      <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
    </button>
  )

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
      <h3 className="font-bold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )

  const Row = ({ label, desc, children }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

        <Section title="Notifications">
          <Row label="Email Notifications" desc="Receive order confirmations and updates via email">
            <Toggle checked={notifications.email} onChange={v => setNotifications({...notifications, email: v})} />
          </Row>
          <Row label="SMS Notifications" desc="Get delivery status updates on your phone">
            <Toggle checked={notifications.sms} onChange={v => setNotifications({...notifications, sms: v})} />
          </Row>
          <Row label="Promotional Emails" desc="Stay updated on sales, new arrivals, and offers">
            <Toggle checked={notifications.promo} onChange={v => setNotifications({...notifications, promo: v})} />
          </Row>
          <Row label="Order Status Updates" desc="Real-time notifications for your orders">
            <Toggle checked={notifications.orderUpdates} onChange={v => setNotifications({...notifications, orderUpdates: v})} />
          </Row>
        </Section>

        <Section title="Privacy">
          <Row label="Public Profile" desc="Allow others to see your profile and flower collections">
            <Toggle checked={privacy.publicProfile} onChange={v => setPrivacy({...privacy, publicProfile: v})} />
          </Row>
          <Row label="Share Activity" desc="Share your purchases and wishlists publicly">
            <Toggle checked={privacy.shareActivity} onChange={v => setPrivacy({...privacy, shareActivity: v})} />
          </Row>
        </Section>

        <Section title="Account">
          <Row label="Change Password" desc="Update your account password">
            <button onClick={() => onNavigate("forgot-password")} className="text-sm font-semibold px-4 py-1.5 rounded-lg border transition hover:bg-gray-50" style={{ borderColor: G, color: G }}>Change</button>
          </Row>
          <Row label="Language" desc="Choose your preferred language">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option>English</option>
              <option>Filipino</option>
            </select>
          </Row>
        </Section>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <h3 className="font-bold text-red-500 mb-1">Danger Zone</h3>
          <p className="text-sm text-gray-400 mb-4">These actions are permanent and cannot be undone.</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => { logout(); onNavigate("login"); }}
              className="px-5 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              Sign Out
            </button>
            <button className="px-5 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
