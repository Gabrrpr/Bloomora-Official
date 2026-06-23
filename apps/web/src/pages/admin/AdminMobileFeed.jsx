import { useCallback, useEffect, useMemo, useState } from "react"

import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api"

const TABS = [
  { value: "explore", label: "Explore" },
  { value: "new", label: "What's New" },
  { value: "for-you", label: "For You" },
]
const BRANCHES = ["all", "manila", "pampanga"]

function emptyPost() {
  return {
    title: "",
    description: "",
    badge: "",
    cta_label: "",
    media_type: "image",
    media_url: "",
    poster_url: "",
    publish_mode: "draft",
    scheduled_at: "",
    end_at: "",
    action_type: "none",
    target_id: "",
    branch: "all",
    tab: "new",
    priority: "standard",
    web_banner_url: "",
    mobile_banner_url: "",
  }
}

function toLocalInput(value) {
  if (!value) return ""
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function postFromCampaign(campaign) {
  let actionType = "none"
  let targetId = ""
  if (campaign.linked_product_id) {
    actionType = "product"
    targetId = campaign.linked_product_id
  } else if (campaign.voucher_id) {
    actionType = "voucher"
    targetId = campaign.voucher_id
  } else if (campaign.cta_destination === "/categories") {
    actionType = "shop"
  }
  const placement = campaign.placements?.[0]
  return {
    ...emptyPost(),
    title: campaign.accessible_title || campaign.name || "",
    description: campaign.description || "",
    badge: campaign.badge || "",
    cta_label: campaign.cta_label || "",
    media_type: campaign.feed_media_type || "image",
    media_url: campaign.feed_media_url || "",
    poster_url: campaign.feed_poster_url || "",
    publish_mode: campaign.state === "draft" ? "draft" : campaign.state === "scheduled" ? "scheduled" : "now",
    scheduled_at: campaign.state === "scheduled" ? toLocalInput(campaign.start_at) : "",
    end_at: toLocalInput(campaign.end_at),
    action_type: actionType,
    target_id: targetId,
    branch: placement?.branch || campaign.branches?.[0] || "all",
    tab: placement?.tab || "new",
    priority: placement?.slot <= 3 ? "featured" : "standard",
    web_banner_url: campaign.web_banner_url || "",
    mobile_banner_url: campaign.mobile_banner_url || "",
  }
}

function toPayload(form) {
  return {
    ...form,
    title: form.title.trim(),
    description: form.description.trim() || null,
    badge: form.badge.trim() || null,
    cta_label: form.cta_label.trim() || null,
    target_id: ["product", "voucher"].includes(form.action_type) ? form.target_id || null : null,
    scheduled_at: form.publish_mode === "scheduled" && form.scheduled_at
      ? new Date(form.scheduled_at).toISOString()
      : null,
    end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
    poster_url: form.poster_url || null,
    web_banner_url: form.web_banner_url || null,
    mobile_banner_url: form.mobile_banner_url || null,
  }
}

export default function AdminMobileFeed() {
  const { isDark } = useTheme()
  const [campaigns, setCampaigns] = useState([])
  const [products, setProducts] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [controls, setControls] = useState([])
  const [preview, setPreview] = useState([])
  const [analytics, setAnalytics] = useState({ totals: {}, top_promotions: [] })
  const [branch, setBranch] = useState("manila")
  const [tab, setTab] = useState("explore")
  const [productQuery, setProductQuery] = useState("")
  const [targetQuery, setTargetQuery] = useState("")
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyPost)
  const [composing, setComposing] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const colors = {
    card: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#111827",
    muted: isDark ? "#94a3b8" : "#64748b",
    input: isDark ? "#111827" : "#ffffff",
    green: isDark ? "#4ade80" : "#2E8B34",
  }
  const inputStyle = { backgroundColor: colors.input, border: `1px solid ${colors.border}`, color: colors.text }

  const load = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      const [campaignData, productData, voucherData, controlData, previewData, analyticsData] = await Promise.all([
        api.getMobileFeedCampaigns(),
        api.getAdminProducts(),
        api.getPromos(),
        api.getMobileFeedProductControls(branch),
        api.previewMobileFeed(tab, branch),
        api.getMobileFeedAnalytics(tab, branch),
      ])
      setCampaigns(campaignData || [])
      setProducts(productData?.data || productData || [])
      setVouchers(voucherData?.data || voucherData || [])
      setControls(controlData || [])
      setPreview(previewData?.items || [])
      setAnalytics(analyticsData || { totals: {}, top_promotions: [] })
    } catch (loadError) {
      setError(loadError.message || "Unable to load Mobile Feed CMS.")
    } finally {
      setBusy(false)
    }
  }, [branch, tab])

  useEffect(() => { void load() }, [load])

  const filteredControls = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    return controls.filter(item => !query || `${item.name} ${item.category}`.toLowerCase().includes(query))
  }, [controls, productQuery])

  const targetOptions = useMemo(() => {
    const source = form.action_type === "product" ? products : form.action_type === "voucher" ? vouchers : []
    const query = targetQuery.trim().toLowerCase()
    return source.filter(item => {
      const text = form.action_type === "voucher" ? `${item.code} ${item.description || ""}` : `${item.name} ${item.category || ""}`
      return !query || text.toLowerCase().includes(query)
    }).slice(0, 30)
  }, [form.action_type, products, targetQuery, vouchers])

  const startCreate = () => {
    setEditing(null)
    setForm({ ...emptyPost(), publish_mode: "now" })
    setTargetQuery("")
    setAdvanced(false)
    setComposing(true)
    setError("")
  }

  const startEdit = campaign => {
    setEditing(campaign.id)
    setForm(postFromCampaign(campaign))
    setTargetQuery("")
    setAdvanced(false)
    setComposing(true)
    setError("")
  }

  const closeComposer = () => {
    setEditing(null)
    setForm(emptyPost())
    setComposing(false)
    setError("")
  }

  const upload = async (field, file) => {
    if (!file) return
    setBusy(true)
    setError("")
    try {
      const result = await api.uploadImage("advertisements", file)
      setForm(current => ({ ...current, [field]: result.url }))
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.")
    } finally {
      setBusy(false)
    }
  }

  const savePost = async event => {
    event.preventDefault()
    if (!form.title.trim() || !form.media_url) {
      setError("Add a title and upload the feed media.")
      return
    }
    if (form.publish_mode === "scheduled" && !form.scheduled_at) {
      setError("Choose a publish date and time.")
      return
    }
    if (["product", "voucher"].includes(form.action_type) && !form.target_id) {
      setError(`Select a ${form.action_type} for this action.`)
      return
    }
    if (form.media_type === "video" && !form.poster_url) {
      setError("Upload a poster image for the video.")
      return
    }
    setBusy(true)
    setError("")
    try {
      if (editing) {
        await api.updateMobileFeedPost(editing, toPayload(form))
      } else {
        await api.createMobileFeedPost(toPayload(form))
      }
      closeComposer()
      await load()
    } catch (saveError) {
      setError(saveError.message || "Unable to save feed post.")
    } finally {
      setBusy(false)
    }
  }

  const updateControl = async (item, patch) => {
    const current = item.control || { branch, is_hidden: false, boost_level: "none" }
    await api.setMobileFeedProductControl(item.product_id, { ...current, ...patch, branch })
    await load()
  }

  return (
    <div className="space-y-5" style={{ color: colors.text }}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Mobile Feed</h1>
          <p className="text-sm mt-1" style={{ color: colors.muted }}>Create feed posts, schedule campaigns, and influence product recommendations.</p>
        </div>
        <button onClick={startCreate} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-green-700">Create post</button>
      </header>

      {error ? <div className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700">{error}</div> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["impression", "open", "add_to_cart", "voucher_copy"].map(key => (
          <div key={key} className="rounded-xl p-4" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: colors.muted }}>{key.replaceAll("_", " ")}</p>
            <p className="text-2xl font-bold mt-1">{analytics.totals?.[key] || 0}</p>
          </div>
        ))}
      </div>

      {composing ? (
        <form onSubmit={savePost} className="rounded-2xl p-5 space-y-5" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg">{editing ? "Edit post" : "Create a feed post"}</h2>
              <p className="text-xs mt-1" style={{ color: colors.muted }}>Upload media, write the post, then publish. IDs and feed slots are handled automatically.</p>
            </div>
            <button type="button" onClick={closeComposer} style={{ color: colors.muted }}>Close</button>
          </div>

          <UploadCard
            accept="image/*,video/mp4,video/webm"
            label="Feed media"
            mediaType={form.media_type}
            value={form.media_url}
            onFile={file => {
              const mediaType = file.type.startsWith("video/") ? "video" : "image"
              setForm(current => ({ ...current, media_type: mediaType, poster_url: mediaType === "image" ? "" : current.poster_url }))
              void upload("media_url", file)
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title">
              <input style={inputStyle} className="w-full rounded-lg px-3 py-2.5" placeholder="Happy Mother's Day!" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
            </Field>
            <Field label="Badge (optional)">
              <input style={inputStyle} className="w-full rounded-lg px-3 py-2.5" placeholder="New" value={form.badge} onChange={event => setForm({ ...form, badge: event.target.value })} />
            </Field>
          </div>
          <Field label="Caption">
            <textarea style={inputStyle} className="w-full rounded-lg px-3 py-2.5 min-h-24" placeholder="Tell customers about this campaign..." value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Action">
              <select style={inputStyle} className="w-full rounded-lg px-3 py-2.5" value={form.action_type} onChange={event => {
                setTargetQuery("")
                setForm({ ...form, action_type: event.target.value, target_id: "" })
              }}>
                <option value="none">No action</option>
                <option value="shop">Open Shop</option>
                <option value="product">Open a product</option>
                <option value="voucher">Show a voucher</option>
              </select>
            </Field>
            <Field label="Button label">
              <input style={inputStyle} className="w-full rounded-lg px-3 py-2.5" placeholder="Shop now" value={form.cta_label} onChange={event => setForm({ ...form, cta_label: event.target.value })} />
            </Field>
            <Field label="Publishing">
              <select style={inputStyle} className="w-full rounded-lg px-3 py-2.5" value={form.publish_mode} onChange={event => setForm({ ...form, publish_mode: event.target.value })}>
                <option value="now">Publish now</option>
                <option value="scheduled">Schedule</option>
                <option value="draft">Save draft</option>
              </select>
            </Field>
          </div>

          {["product", "voucher"].includes(form.action_type) ? (
            <div className="rounded-xl p-4 space-y-3" style={{ border: `1px solid ${colors.border}` }}>
              <Field label={`Find ${form.action_type}`}>
                <input style={inputStyle} className="w-full rounded-lg px-3 py-2.5" placeholder={`Search ${form.action_type}s...`} value={targetQuery} onChange={event => setTargetQuery(event.target.value)} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-auto">
                {targetOptions.map(item => {
                  const id = item.id
                  const label = form.action_type === "voucher" ? item.code : item.name
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setForm({ ...form, target_id: id })}
                      className="text-left rounded-lg px-3 py-2 text-sm"
                      style={{
                        border: `1px solid ${form.target_id === id ? colors.green : colors.border}`,
                        backgroundColor: form.target_id === id ? (isDark ? "#14532d" : "#f0fdf4") : "transparent",
                      }}>
                      <span className="font-semibold">{label}</span>
                      {item.category ? <span className="block text-xs mt-0.5" style={{ color: colors.muted }}>{item.category}</span> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {form.publish_mode === "scheduled" ? (
            <Field label="Publish date and time">
              <input type="datetime-local" style={inputStyle} className="w-full md:w-80 rounded-lg px-3 py-2.5" value={form.scheduled_at} onChange={event => setForm({ ...form, scheduled_at: event.target.value })} />
            </Field>
          ) : null}

          <button type="button" onClick={() => setAdvanced(value => !value)} className="text-sm font-semibold" style={{ color: colors.green }}>
            {advanced ? "Hide advanced settings" : "Advanced settings"}
          </button>

          {advanced ? (
            <div className="rounded-xl p-4 space-y-4" style={{ border: `1px solid ${colors.border}` }}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Field label="Feed tab">
                  <select style={inputStyle} className="w-full rounded-lg px-3 py-2" value={form.tab} onChange={event => setForm({ ...form, tab: event.target.value })}>
                    {TABS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </Field>
                <Field label="Branch">
                  <select style={inputStyle} className="w-full rounded-lg px-3 py-2" value={form.branch} onChange={event => setForm({ ...form, branch: event.target.value })}>
                    {BRANCHES.map(value => <option key={value} value={value}>{value === "all" ? "All branches" : value}</option>)}
                  </select>
                </Field>
                <Field label="Placement priority">
                  <select style={inputStyle} className="w-full rounded-lg px-3 py-2" value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}>
                    <option value="standard">Standard</option>
                    <option value="featured">Featured</option>
                  </select>
                </Field>
                <Field label="Expire (optional)">
                  <input type="datetime-local" style={inputStyle} className="w-full rounded-lg px-3 py-2" value={form.end_at} onChange={event => setForm({ ...form, end_at: event.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {form.media_type === "video" ? <UploadCard accept="image/*" label="Video poster" mediaType="image" value={form.poster_url} onFile={file => void upload("poster_url", file)} /> : null}
                <UploadCard accept="image/*" label="Web banner" mediaType="image" value={form.web_banner_url} onFile={file => void upload("web_banner_url", file)} />
                <UploadCard accept="image/*" label="Mobile banner (1080x500)" mediaType="image" value={form.mobile_banner_url} onFile={file => void upload("mobile_banner_url", file)} />
              </div>
            </div>
          ) : null}

          <button disabled={busy} className="px-6 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50 bg-green-700">
            {busy ? "Saving..." : form.publish_mode === "draft" ? "Save draft" : form.publish_mode === "scheduled" ? "Schedule post" : "Publish post"}
          </button>
        </form>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-5">
          <section className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="px-4 py-3 border-b font-bold" style={{ borderColor: colors.border }}>Feed posts</div>
            {campaigns.length ? campaigns.map(campaign => (
              <div key={campaign.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: colors.border }}>
                <div className="w-14 h-20 rounded bg-slate-200 overflow-hidden flex-shrink-0">
                  {campaign.feed_media_type === "video"
                    ? <video muted src={campaign.feed_media_url} poster={campaign.feed_poster_url} className="w-full h-full object-cover" />
                    : campaign.feed_media_url ? <img alt="" src={campaign.feed_media_url} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{campaign.accessible_title || campaign.name}</p>
                  <p className="text-xs mt-1" style={{ color: colors.muted }}>
                    {campaign.state} · {campaign.like_count} likes · {campaign.placements?.map(item => `${item.tab} #${item.slot}`).join(", ") || "unplaced"}
                  </p>
                </div>
                <button onClick={() => startEdit(campaign)} className="text-sm font-semibold" style={{ color: colors.green }}>Edit</button>
                <button onClick={async () => {
                  if (confirm(`Delete ${campaign.name}?`)) {
                    await api.deleteMobileFeedCampaign(campaign.id)
                    await load()
                  }
                }} className="text-sm font-semibold text-red-500">Delete</button>
              </div>
            )) : <p className="p-5 text-sm" style={{ color: colors.muted }}>No feed posts yet.</p>}
          </section>

          <section className="rounded-xl p-4 space-y-3" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <h2 className="font-bold">Product influence</h2>
                <p className="text-xs mt-1" style={{ color: colors.muted }}>Hide products only from Home Feed or apply a bounded ranking boost.</p>
              </div>
              <input placeholder="Search products..." style={inputStyle} className="rounded-lg px-3 py-2 text-sm" value={productQuery} onChange={event => setProductQuery(event.target.value)} />
            </div>
            <div className="max-h-[520px] overflow-auto divide-y" style={{ borderColor: colors.border }}>
              {filteredControls.map(item => (
                <div key={item.product_id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs" style={{ color: colors.muted }}>{item.category}</p>
                  </div>
                  <select style={inputStyle} className="rounded-lg px-2 py-1.5 text-sm" value={item.control?.boost_level || "none"} onChange={event => void updateControl(item, { boost_level: event.target.value })}>
                    {["none", "low", "medium", "high"].map(value => <option key={value}>{value}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={item.control?.is_hidden || false} onChange={event => void updateControl(item, { is_hidden: event.target.checked })} />
                    Hidden
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <div className="flex gap-2">
            <select style={inputStyle} className="flex-1 rounded-lg px-2 py-2 text-sm" value={branch} onChange={event => setBranch(event.target.value)}>
              {BRANCHES.filter(value => value !== "all").map(value => <option key={value}>{value}</option>)}
            </select>
            <select style={inputStyle} className="flex-1 rounded-lg px-2 py-2 text-sm" value={tab} onChange={event => setTab(event.target.value)}>
              {TABS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="rounded-[28px] bg-black p-2 shadow-xl">
            <div className="aspect-[9/16] rounded-[22px] overflow-hidden bg-zinc-900 relative">
              {preview[0]?.type === "promotion" ? (
                preview[0].promotion.media_type === "video"
                  ? <video autoPlay loop muted playsInline poster={preview[0].promotion.poster_url} src={preview[0].promotion.media_url} className="w-full h-full object-cover" />
                  : <img alt="" src={preview[0].promotion.media_url} className="w-full h-full object-cover" />
              ) : preview[0]?.product?.image_url ? (
                <>
                  <img alt="" src={preview[0].product.image_url} className="absolute inset-0 w-full h-full object-cover opacity-25 blur-lg" />
                  <div className="absolute left-4 right-4 top-24 h-56 rounded-lg overflow-hidden">
                    <img alt="" src={preview[0].product.image_url} className="w-full h-full object-cover" />
                  </div>
                </>
              ) : null}
              <div className="absolute left-4 right-16 bottom-16 text-white">
                <p className="font-bold text-lg">{preview[0]?.type === "promotion" ? preview[0].promotion.title : preview[0]?.product?.name}</p>
                <p className="text-xs mt-1 line-clamp-3">{preview[0]?.type === "promotion" ? preview[0].promotion.description : preview[0]?.product?.description}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: colors.muted }}>First assembled item for this branch and tab.</p>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <label className="block"><span className="block text-xs font-semibold mb-1.5">{label}</span>{children}</label>
}

function UploadCard({ accept, label, mediaType, onFile, value }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-400 p-3 space-y-2">
      <p className="text-xs font-semibold">{label}</p>
      {value ? (
        <div className="h-32 rounded-lg overflow-hidden bg-slate-100">
          {mediaType === "video"
            ? <video muted controls src={value} className="w-full h-full object-cover" />
            : <img alt="" src={value} className="w-full h-full object-cover" />}
        </div>
      ) : <div className="h-20 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500">No media uploaded</div>}
      <input type="file" accept={accept} onChange={event => onFile(event.target.files?.[0])} className="block w-full text-xs" />
    </div>
  )
}
