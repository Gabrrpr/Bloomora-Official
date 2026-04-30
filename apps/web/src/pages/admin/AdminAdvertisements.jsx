import { useState, useMemo } from "react"

const DG = "#0C573E"
const G  = "#2E8B34"

const ADS = [
  { id: 1, title: "Happy Mother's Day" },
  { id: 2, title: "Happy Father's Day" },
  { id: 3, title: "Happy Valentine's Day" },
  { id: 4, title: "Birthday" },
  { id: 5, title: "Happy Valentine's Day" },
  { id: 6, title: "Happy Chinese New Year" },
  { id: 7, title: "Happy Teacher's Day" },
  { id: 8, title: "Ribbon Cutting Ceremony" },
  { id: 9, title: "Graduation Day" },
]

const getAdSrc = (id) =>
  new URL(`../../assets/ads/advertisement${id}.webp`, import.meta.url).href

export default function AdminAdvertisements() {
  const [active,  setActive]  = useState(1)
  const [preview, setPreview] = useState(null)
  const [saved,   setSaved]   = useState(false)

  const activeAd = useMemo(() => ADS.find(a => a.id === active), [active])
  const handleSetActive = (id) => { setActive(id); setSaved(false) }
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pop-up Advertisements</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage which advertisement is displayed as a pop-up on the customer site.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
          {saved
            ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Saved!</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Save Changes</>
          }
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-2.5" style={{ background: `linear-gradient(90deg, ${DG}, #1a6b4a)` }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <p className="text-xs font-bold tracking-widest uppercase text-white/80">Currently Active Ad</p>
          </div>
          <p className="text-xs font-semibold text-white/60">Ad {active} of {ADS.length}</p>
        </div>
        <div className="bg-white grid grid-cols-1 md:grid-cols-[1fr_320px] divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex items-center justify-center bg-gray-50 p-8">
            <img src={getAdSrc(activeAd.id)} alt={activeAd.title}
              className="rounded-xl object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
              style={{ maxHeight: "340px", width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
              onClick={() => setPreview(activeAd)} decoding="async"/>
          </div>
          <div className="flex flex-col justify-between px-6 py-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: G }}>Active Advertisement</p>
                <p className="text-xl font-bold text-gray-900 leading-tight">{activeAd.title}</p>
                <p className="text-xs text-gray-400 mt-1">advertisement{activeAd.id}.webp</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md w-fit" style={{ backgroundColor: "#f0fdf4", color: G, border: "1px solid #bbf7d0" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Live on customer site
                </span>
                <button onClick={() => setPreview(activeAd)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-all text-gray-600 w-fit">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  Preview Full Size
                </button>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">All Slots</p>
                <div className="flex flex-wrap gap-1.5">
                  {ADS.map(ad => (
                    <button key={ad.id} onClick={() => handleSetActive(ad.id)} title={ad.title}
                      className="w-7 h-7 rounded-md text-[11px] font-bold transition-all hover:scale-110"
                      style={{ backgroundColor: ad.id === active ? G : "#f1f5f9", color: ad.id === active ? "white" : "#6b7280", border: ad.id === active ? `1px solid ${G}` : "1px solid #e2e8f0" }}>
                      {ad.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
              Select a slot above or click a card below, then hit <span className="font-semibold text-gray-600">Save Changes</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <p className="text-sm font-semibold text-gray-800">All Advertisements <span className="ml-2 text-xs font-normal text-gray-400">{ADS.length} total</span></p>
          <p className="text-xs text-gray-400 hidden sm:block">Click a card to select · Eye icon for full preview</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
          {ADS.map(ad => {
            const isActive = ad.id === active
            return (
              <div key={ad.id} onClick={() => handleSetActive(ad.id)}
                className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{ border: isActive ? `2px solid ${G}` : "2px solid #e8edf2", boxShadow: isActive ? `0 0 0 3px rgba(46,139,52,0.12),0 4px 12px rgba(0,0,0,0.06)` : "0 1px 4px rgba(0,0,0,0.04)", transform: isActive ? "translateY(-2px)" : "translateY(0)" }}>
                <div className="relative bg-gray-50" style={{ aspectRatio: "4/3" }}>
                  <img src={getAdSrc(ad.id)} alt={ad.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: G, boxShadow: "0 2px 6px rgba(46,139,52,0.4)" }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ background: "rgba(0,0,0,0.38)" }}>
                    <button onClick={e => { e.stopPropagation(); setPreview(ad) }} className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow hover:scale-105 transition-transform" title="Preview">
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    {!isActive && (
                      <button onClick={e => { e.stopPropagation(); handleSetActive(ad.id) }} className="w-8 h-8 rounded-md flex items-center justify-center shadow hover:scale-105 transition-transform text-white" style={{ backgroundColor: G }} title="Set as active">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-3 py-2.5" style={{ backgroundColor: isActive ? "#f0fdf4" : "#ffffff", borderTop: `1px solid ${isActive ? "rgba(46,139,52,0.12)" : "#f1f5f9"}` }}>
                  <p className="text-[11px] font-semibold truncate text-gray-800">{ad.title}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-gray-400">Ad {ad.id}</p>
                    {isActive && <span className="flex items-center gap-1 text-[9px] font-bold" style={{ color: G }}><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Active</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.70)", backdropFilter: "blur(4px)" }} onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl overflow-hidden w-full" style={{ maxWidth: "580px", boxShadow: "0 32px 80px rgba(0,0,0,0.35)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <p className="text-sm font-bold text-gray-900">{preview.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">advertisement{preview.id}.webp</p>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="bg-gray-50 p-6 flex items-center justify-center">
              <img src={getAdSrc(preview.id)} alt={preview.title} className="rounded-lg max-h-96 w-full object-contain" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }} decoding="async"/>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              {active === preview.id
                ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md" style={{ backgroundColor: "#f0fdf4", color: G, border: "1px solid #bbf7d0" }}><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Currently Active</span>
                : <p className="text-xs text-gray-400">Not currently active</p>
              }
              {active !== preview.id && (
                <button onClick={() => { handleSetActive(preview.id); setPreview(null) }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90 transition-all active:scale-95" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  Set as Active
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}