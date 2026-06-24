import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import estingsMobileHeaderLogo from "../../../../mobile/estings-mobile/assets/images/branding/estingsFlowerShop-logo-white.svg"
import mobileInterRegular from "../../../../mobile/estings-mobile/node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf?url"
import mobileInterMedium from "../../../../mobile/estings-mobile/node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf?url"
import mobileInterBold from "../../../../mobile/estings-mobile/node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf?url"
import mobileInterExtraBold from "../../../../mobile/estings-mobile/node_modules/@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf?url"
import mobileInterTightMedium from "../../../../mobile/estings-mobile/node_modules/@expo-google-fonts/inter-tight/500Medium/InterTight_500Medium.ttf?url"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api"
import {
  APP_FEATURES,
  BRANCHES,
  FEED_TABS,
  isMockMobileContent,
  mobileContentService,
} from "../../services/mobile-content-service"

const FEED_OUTPUT = { width: 1440, height: 2560, label: "1440 × 2560 px", ratio: 9 / 16 }
const BANNER_OUTPUT = { width: 1080, height: 500, label: "1080 × 500 px", ratio: 1080 / 500 }

function emptyFeedPost(sortOrder = 10) {
  return {
    id: "",
    internalTitle: "",
    title: "",
    caption: "",
    badge: "",
    media: null,
    action: { type: "none", targetId: "", label: "" },
    tab: "explore",
    branch: "all",
    publishMode: "draft",
    scheduledAt: "",
    expiresAt: "",
    status: "draft",
    sortOrder,
    likeCount: 0,
  }
}

function emptyBanner(sortOrder = 10) {
  return {
    id: "",
    internalTitle: "",
    accessibleLabel: "",
    media: null,
    action: { type: "none", targetId: "", label: "" },
    branch: "all",
    publishMode: "draft",
    scheduledAt: "",
    expiresAt: "",
    status: "draft",
    sortOrder,
  }
}

function dateTimeLocal(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function normalizeRecord(record) {
  return {
    ...record,
    scheduledAt: dateTimeLocal(record.scheduledAt),
    expiresAt: dateTimeLocal(record.expiresAt),
  }
}

function readMediaMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    if (file.type.startsWith("video/")) {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => resolve({
        durationSeconds: video.duration,
        height: video.videoHeight,
        kind: "video",
        previewUrl: url,
        width: video.videoWidth,
      })
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("We could not read this video. Try exporting it again as MP4, MOV, or WebM."))
      }
      video.src = url
      return
    }
    const image = new Image()
    image.onload = () => resolve({
      durationSeconds: null,
      height: image.naturalHeight,
      kind: "image",
      previewUrl: url,
      width: image.naturalWidth,
    })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("We could not read this image. Try saving it again as PNG, JPG, or WebP."))
    }
    image.src = url
  })
}

async function cropImage(file, metadata, output, zoom, positionX, positionY) {
  const image = await new Promise((resolve, reject) => {
    const next = new Image()
    next.onload = () => resolve(next)
    next.onerror = () => reject(new Error("The selected image could not be prepared."))
    next.src = metadata.previewUrl
  })
  const canvas = document.createElement("canvas")
  canvas.width = output.width
  canvas.height = output.height
  const context = canvas.getContext("2d")
  const coverScale = Math.max(output.width / metadata.width, output.height / metadata.height)
  const scale = coverScale * zoom
  const drawWidth = metadata.width * scale
  const drawHeight = metadata.height * scale
  const overflowX = Math.max(drawWidth - output.width, 0)
  const overflowY = Math.max(drawHeight - output.height, 0)
  const x = -(overflowX * (positionX / 100))
  const y = -(overflowY * (positionY / 100))
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(image, x, y, drawWidth, drawHeight)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9))
  if (!blob) throw new Error("The browser could not prepare this image.")
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" })
}

function formatBytes(bytes = 0) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function statusLabel(item) {
  if (item.publishMode === "draft") return "Draft"
  if (item.publishMode === "scheduled") return "Scheduled"
  return "Published"
}

function readableError(error, fallback = "Something went wrong.") {
  if (!error) return fallback
  if (typeof error === "string") return error
  if (error instanceof Error && error.message && error.message !== "[object Object]") return error.message
  const detail = error.detail ?? error.message ?? error.error
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item
        const location = Array.isArray(item?.loc) ? item.loc.join(".") : ""
        const message = item?.msg || item?.message
        return [location, message].filter(Boolean).join(": ")
      })
      .filter(Boolean)
      .join(" ")
      || fallback
  }
  if (detail && typeof detail === "object") return detail.msg || detail.message || JSON.stringify(detail)
  try {
    return JSON.stringify(error)
  } catch {
    return fallback
  }
}

export default function AdminMobileFeed() {
  const { isDark } = useTheme()
  const [section, setSection] = useState("feed")
  const [feedPosts, setFeedPosts] = useState([])
  const [banners, setBanners] = useState([])
  const [products, setProducts] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [editing, setEditing] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBranch, setPreviewBranch] = useState("manila")
  const [previewTab, setPreviewTab] = useState("explore")

  const colors = {
    page: isDark ? "#0f172a" : "#f7f9fc",
    card: isDark ? "#1e293b" : "#ffffff",
    cardAlt: isDark ? "#162032" : "#f8fafc",
    border: isDark ? "#334155" : "#e2e8f0",
    input: isDark ? "#0f172a" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#111827",
    secondary: isDark ? "#cbd5e1" : "#475569",
    muted: isDark ? "#94a3b8" : "#64748b",
    green: isDark ? "#4ade80" : "#237a3b",
    greenSoft: isDark ? "rgba(74,222,128,.12)" : "#eefbf2",
  }
  const inputStyle = {
    backgroundColor: colors.input,
    border: `1px solid ${colors.border}`,
    color: colors.text,
  }

  const load = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      const [nextPosts, nextBanners, productResponse, voucherResponse] = await Promise.all([
        mobileContentService.listFeedPosts(),
        mobileContentService.listBanners(),
        api.getAdminProducts().catch(() => []),
        api.getPromos().catch(() => []),
      ])
      setFeedPosts(nextPosts)
      setBanners(nextBanners)
      setProducts(productResponse?.data || productResponse || [])
      setVouchers(voucherResponse?.data || voucherResponse || [])
      setEditing((current) => current || normalizeRecord(nextPosts[0] || emptyFeedPost()))
    } catch (loadError) {
      setError(readableError(loadError, "Mobile Content could not be loaded."))
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const warn = (event) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const updateEditing = (patch) => {
    setEditing((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  const switchSection = (nextSection) => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return
    setSection(nextSection)
    setDirty(false)
    const records = nextSection === "feed" ? feedPosts : banners
    const blank = nextSection === "feed" ? emptyFeedPost : emptyBanner
    setEditing(normalizeRecord(records[0] || blank()))
  }

  const startCreate = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return
    const records = section === "feed" ? feedPosts : banners
    const blank = section === "feed" ? emptyFeedPost : emptyBanner
    setEditing(blank((records.length + 1) * 10))
    setDirty(false)
  }

  const selectRecord = (record) => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return
    setEditing(normalizeRecord(record))
    setDirty(false)
  }

  const validationMessage = useMemo(() => {
    if (!editing) return "Choose or create content."
    if (!editing.internalTitle?.trim()) return "Add an internal name so staff can identify this content."
    if (!editing.media) return "Add the image or video customers will see."
    if (section === "feed" && !editing.title?.trim()) return "Add the customer-facing title."
    if (section === "banner" && !editing.accessibleLabel?.trim()) return "Add an accessible description for the banner."
    if (editing.action?.type !== "none" && !editing.action?.targetId) return "Choose where customers should go when they tap."
    if (editing.publishMode === "scheduled" && !editing.scheduledAt) return "Choose the date and time this should appear."
    if (editing.expiresAt && editing.scheduledAt && new Date(editing.expiresAt) <= new Date(editing.scheduledAt)) {
      return "The end date must be later than the scheduled date."
    }
    return ""
  }, [editing, section])

  const save = async () => {
    if (validationMessage) {
      setError(validationMessage)
      return
    }
    setBusy(true)
    setError("")
    try {
      const payload = {
        ...editing,
        internalTitle: editing.internalTitle.trim(),
        status: editing.publishMode === "draft" ? "draft" : "published",
        scheduledAt: editing.publishMode === "scheduled" && editing.scheduledAt
          ? new Date(editing.scheduledAt).toISOString()
          : null,
        expiresAt: editing.expiresAt ? new Date(editing.expiresAt).toISOString() : null,
      }
      const saved = section === "feed"
        ? await mobileContentService.saveFeedPost(payload)
        : await mobileContentService.saveBanner(payload)
      if (section === "feed") {
        setFeedPosts((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.sortOrder - b.sortOrder))
      } else {
        setBanners((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.sortOrder - b.sortOrder))
      }
      setEditing(normalizeRecord(saved))
      setDirty(false)
    } catch (saveError) {
      setError(readableError(saveError, "This content could not be saved."))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (record) => {
    if (!window.confirm(`Delete “${record.internalTitle}”?`)) return
    if (section === "feed") {
      await mobileContentService.deleteFeedPost(record.id)
      const next = feedPosts.filter((item) => item.id !== record.id)
      setFeedPosts(next)
      setEditing(normalizeRecord(next[0] || emptyFeedPost()))
    } else {
      await mobileContentService.deleteBanner(record.id)
      const next = banners.filter((item) => item.id !== record.id)
      setBanners(next)
      setEditing(normalizeRecord(next[0] || emptyBanner()))
    }
    setDirty(false)
  }

  const move = async (record, direction) => {
    const records = section === "feed" ? feedPosts : banners
    const index = records.findIndex((item) => item.id === record.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= records.length) return
    const next = [...records]
    ;[next[index], next[target]] = [next[target], next[index]]
    const ids = next.map((item) => item.id)
    if (section === "feed") {
      setFeedPosts(next)
      await mobileContentService.reorderFeedPosts(ids)
    } else {
      setBanners(next)
      await mobileContentService.reorderBanners(ids)
    }
  }

  const records = section === "feed" ? feedPosts : banners
  const previewRecord = editing || records[0]

  return (
    <div className="space-y-5" style={{ color: colors.text }}>
      <style>{`
        @font-face { font-family: "Mobile Inter"; src: url("${mobileInterRegular}") format("truetype"); font-weight: 400; }
        @font-face { font-family: "Mobile Inter"; src: url("${mobileInterMedium}") format("truetype"); font-weight: 500; }
        @font-face { font-family: "Mobile Inter"; src: url("${mobileInterBold}") format("truetype"); font-weight: 700; }
        @font-face { font-family: "Mobile Inter"; src: url("${mobileInterExtraBold}") format("truetype"); font-weight: 800; }
        @font-face { font-family: "Mobile Inter Tight"; src: url("${mobileInterTightMedium}") format("truetype"); font-weight: 500; }
      `}</style>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">Mobile Content</h1>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: isMockMobileContent ? "#fff7ed" : colors.greenSoft, color: isMockMobileContent ? "#c2410c" : colors.green }}>
              {isMockMobileContent ? "Development preview" : "API mode"}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: colors.muted }}>
            {isMockMobileContent
              ? "Prepare the posts and banners customers will see in the mobile app. Changes are stored only in this browser for now."
              : "Prepare the posts and banners customers will see in the mobile app. Changes are saved through the backend API."}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPreviewOpen(true)} className="xl:hidden rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ border: `1px solid ${colors.border}` }}>
            Preview
          </button>
          <button type="button" onClick={startCreate} className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white">
            {section === "feed" ? "Create feed post" : "Add banner"}
          </button>
        </div>
      </header>

      <div className="inline-flex rounded-xl p-1" style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}` }}>
        {[["feed", "Feed Posts"], ["banner", "Category Banners"]].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => switchSection(value)}
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: section === value ? colors.card : "transparent",
              color: section === value ? colors.green : colors.muted,
              boxShadow: section === value ? "0 1px 3px rgba(15,23,42,.12)" : "none",
            }}>
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-5">
          <ContentList
            colors={colors}
            records={records}
            selectedId={editing?.id}
            onSelect={selectRecord}
            onMove={move}
            onDelete={remove}
          />

          {editing ? (
            <div className="space-y-5">
              <EditorCard
                title={section === "feed" ? "1. Add the feed media" : "1. Add the banner image"}
                help={section === "feed"
                  ? "Use a clear vertical image or video. The preview shows which areas may be covered by app controls."
                  : "Use a wide image with important details kept away from the far edges."}
                colors={colors}>
                <GuidedMediaUploader
                  allowVideo={section === "feed"}
                  colors={colors}
                  output={section === "feed" ? FEED_OUTPUT : BANNER_OUTPUT}
                  value={editing.media}
                  onChange={(media) => updateEditing({ media })}
                />
              </EditorCard>

              <EditorCard
                title={section === "feed" ? "2. Write the post" : "2. Describe the banner"}
                help="Gray notes explain where each value appears. Customers never see the internal name."
                colors={colors}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Internal name"
                    help="For staff only. Use a name that is easy to find later.">
                    <input
                      value={editing.internalTitle}
                      onChange={(event) => updateEditing({ internalTitle: event.target.value })}
                      placeholder={section === "feed" ? "Example: Mother's Day welcome" : "Example: Make it Personal banner"}
                      className="w-full rounded-lg px-3 py-2.5"
                      style={inputStyle}
                    />
                  </Field>
                  {section === "feed" ? (
                    <Field label="Small badge" help="Optional. Keep it short, such as New or Seasonal.">
                      <input
                        value={editing.badge || ""}
                        onChange={(event) => updateEditing({ badge: event.target.value })}
                        placeholder="Seasonal"
                        className="w-full rounded-lg px-3 py-2.5"
                        style={inputStyle}
                      />
                    </Field>
                  ) : null}
                </div>
                {section === "feed" ? (
                  <>
                    <Field label="Title customers will see" help="Aim for one short sentence that remains readable over the image.">
                      <input
                        value={editing.title}
                        onChange={(event) => updateEditing({ title: event.target.value })}
                        placeholder="Celebrate every kind of mom"
                        className="w-full rounded-lg px-3 py-2.5"
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Caption" help="Optional supporting text. The app shows up to three lines.">
                      <textarea
                        value={editing.caption || ""}
                        onChange={(event) => updateEditing({ caption: event.target.value })}
                        placeholder="Tell customers what makes this collection special."
                        className="min-h-24 w-full rounded-lg px-3 py-2.5"
                        style={inputStyle}
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="Accessible description" help="Describe what the banner offers for customers using screen readers.">
                    <input
                      value={editing.accessibleLabel || ""}
                      onChange={(event) => updateEditing({ accessibleLabel: event.target.value })}
                      placeholder="Create a flower arrangement made for your story"
                      className="w-full rounded-lg px-3 py-2.5"
                      style={inputStyle}
                    />
                  </Field>
                )}
              </EditorCard>

              <EditorCard
                title="3. Choose what happens when tapped"
                help="Customers tap the image itself. No separate button is added."
                colors={colors}>
                <ActionEditor
                  action={editing.action}
                  colors={colors}
                  products={products}
                  vouchers={vouchers}
                  inputStyle={inputStyle}
                  onChange={(action) => updateEditing({ action })}
                />
              </EditorCard>

              <EditorCard
                title="4. Choose where and when it appears"
                help="Use All branches unless this content is intended for only one store."
                colors={colors}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {section === "feed" ? (
                    <Field label="Feed section" help="Explore is popular content, What's New favors recent products, and For You uses customer preferences.">
                      <select value={editing.tab} onChange={(event) => updateEditing({ tab: event.target.value })} className="w-full rounded-lg px-3 py-2.5" style={inputStyle}>
                        {FEED_TABS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </Field>
                  ) : null}
                  <Field label="Store branch" help="All branches shows the content to both Manila and Pampanga customers.">
                    <select value={editing.branch} onChange={(event) => updateEditing({ branch: event.target.value })} className="w-full rounded-lg px-3 py-2.5" style={inputStyle}>
                      {BRANCHES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Publishing" help="Save a draft, show it immediately, or choose a future date.">
                    <select value={editing.publishMode} onChange={(event) => updateEditing({ publishMode: event.target.value })} className="w-full rounded-lg px-3 py-2.5" style={inputStyle}>
                      <option value="draft">Save as draft</option>
                      <option value="now">Publish now</option>
                      <option value="scheduled">Schedule for later</option>
                    </select>
                  </Field>
                  {editing.publishMode === "scheduled" ? (
                    <Field label="Start date and time" help="The content remains hidden until this time.">
                      <input type="datetime-local" value={editing.scheduledAt || ""} onChange={(event) => updateEditing({ scheduledAt: event.target.value })} className="w-full rounded-lg px-3 py-2.5" style={inputStyle} />
                    </Field>
                  ) : null}
                  <Field label="End date and time" help="Optional. Leave empty if it should stay available.">
                    <input type="datetime-local" value={editing.expiresAt || ""} onChange={(event) => updateEditing({ expiresAt: event.target.value })} className="w-full rounded-lg px-3 py-2.5" style={inputStyle} />
                  </Field>
                </div>
              </EditorCard>

              <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl p-3" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, boxShadow: "0 10px 30px rgba(15,23,42,.12)" }}>
                <p className="text-xs" style={{ color: validationMessage ? "#dc2626" : colors.muted }}>
                  {validationMessage || (dirty ? "You have unsaved changes." : "All changes are saved in this development browser.")}
                </p>
                <button
                  type="button"
                  disabled={busy || Boolean(validationMessage)}
                  onClick={() => void save()}
                  className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
                  {busy ? "Saving…" : editing.publishMode === "draft" ? "Save draft" : editing.publishMode === "scheduled" ? "Schedule content" : "Publish content"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-3">
            <PreviewControls
              branch={previewBranch}
              tab={previewTab}
              showTab={section === "feed"}
              colors={colors}
              inputStyle={inputStyle}
              onBranch={setPreviewBranch}
              onTab={setPreviewTab}
            />
            <PhonePreview section={section} record={previewRecord} colors={colors} />
            <p className="text-center text-xs" style={{ color: colors.muted }}>
              Near-real preview. Final spacing may vary slightly by phone.
            </p>
          </div>
        </aside>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 xl:hidden" onMouseDown={() => setPreviewOpen(false)}>
          <div className="max-h-full w-full max-w-sm overflow-auto rounded-2xl p-4" style={{ backgroundColor: colors.card }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Mobile preview</p>
              <button type="button" onClick={() => setPreviewOpen(false)} style={{ color: colors.muted }}>Close</button>
            </div>
            <PreviewControls branch={previewBranch} tab={previewTab} showTab={section === "feed"} colors={colors} inputStyle={inputStyle} onBranch={setPreviewBranch} onTab={setPreviewTab} />
            <PhonePreview section={section} record={previewRecord} colors={colors} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ContentList({ colors, records, selectedId, onSelect, onMove, onDelete }) {
  return (
    <section className="overflow-hidden rounded-xl" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: colors.border }}>
        <div>
          <h2 className="font-bold">Saved content</h2>
          <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>Use the arrows to control which item appears first.</p>
        </div>
        <span className="text-xs" style={{ color: colors.muted }}>{records.length} item{records.length === 1 ? "" : "s"}</span>
      </div>
      {records.length ? records.map((record, index) => (
        <div key={record.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0" style={{ borderColor: colors.border, backgroundColor: selectedId === record.id ? colors.greenSoft : "transparent" }}>
          <button type="button" onClick={() => onSelect(record)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
              {record.media?.kind === "video"
                ? <video src={record.media.url} muted className="h-full w-full object-cover" />
                : record.media?.url ? <img src={record.media.url} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{record.internalTitle}</p>
              <p className="mt-1 text-xs" style={{ color: colors.muted }}>{statusLabel(record)} · {record.branch === "all" ? "All branches" : record.branch}</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <button type="button" disabled={index === 0} onClick={() => void onMove(record, -1)} className="rounded-md px-2 py-1 text-sm disabled:opacity-25" title="Move up">↑</button>
            <button type="button" disabled={index === records.length - 1} onClick={() => void onMove(record, 1)} className="rounded-md px-2 py-1 text-sm disabled:opacity-25" title="Move down">↓</button>
            <button type="button" onClick={() => void onDelete(record)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-500">Delete</button>
          </div>
        </div>
      )) : (
        <p className="px-4 py-8 text-center text-sm" style={{ color: colors.muted }}>No content yet. Use the create button to add the first item.</p>
      )}
    </section>
  )
}

function EditorCard({ title, help, colors, children }) {
  return (
    <section className="space-y-4 rounded-xl p-5" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="mt-1 text-xs leading-5" style={{ color: colors.muted }}>{help}</p>
      </div>
      {children}
    </section>
  )
}

function Field({ label, help, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {help ? <span className="mb-2 block text-xs leading-5 text-slate-500">{help}</span> : null}
      {children}
    </label>
  )
}

function GuidedMediaUploader({ allowVideo, colors, output, value, onChange }) {
  const inputRef = useRef(null)
  const runRef = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState(null)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("idle")
  const [error, setError] = useState("")
  const [zoom, setZoom] = useState(1)
  const [positionX, setPositionX] = useState(50)
  const [positionY, setPositionY] = useState(50)

  const chooseFile = async (file) => {
    if (!file) return
    setError("")
    setProgress(0)
    const imageTypes = ["image/png", "image/jpeg", "image/webp"]
    const videoTypes = ["video/mp4", "video/quicktime", "video/webm"]
    const isVideo = videoTypes.includes(file.type)
    if (!imageTypes.includes(file.type) && !(allowVideo && isVideo)) {
      setError(allowVideo
        ? "Choose a PNG, JPG, WebP, MP4, MOV, or WebM file."
        : "Choose a PNG, JPG, or WebP image.")
      return
    }
    const maximum = isVideo ? 150 * 1024 * 1024 : 15 * 1024 * 1024
    if (file.size > maximum) {
      setError(`This file is too large. Choose one under ${isVideo ? "150 MB" : "15 MB"}.`)
      return
    }
    try {
      const metadata = await readMediaMetadata(file)
      if (metadata.kind === "video") {
        if (metadata.durationSeconds > 30.05) {
          URL.revokeObjectURL(metadata.previewUrl)
          setError("This video is longer than 30 seconds. Trim it before continuing.")
          return
        }
        if (metadata.width < 1080 || metadata.height < 1920) {
          URL.revokeObjectURL(metadata.previewUrl)
          setError("Use a vertical video that is at least 1080 × 1920 pixels.")
          return
        }
      } else if (metadata.width < output.width || metadata.height < output.height) {
        URL.revokeObjectURL(metadata.previewUrl)
        setError(`Use a larger image. It must be at least ${output.label}.`)
        return
      }
      if (selected?.metadata?.previewUrl) URL.revokeObjectURL(selected.metadata.previewUrl)
      setSelected({ file, metadata })
      setStage("editing")
      setZoom(1)
      setPositionX(50)
      setPositionY(50)
    } catch (metadataError) {
      setError(readableError(metadataError, "This file could not be read."))
    }
  }

  const process = async () => {
    if (!selected) return
    const runId = runRef.current + 1
    runRef.current = runId
    setError("")
    setStage("uploading")
    try {
      const preparedFile = selected.metadata.kind === "image"
        ? await cropImage(selected.file, selected.metadata, output, zoom, positionX, positionY)
        : selected.file
      const media = await mobileContentService.simulateMediaJob({
        file: preparedFile,
        kind: selected.metadata.kind,
        output: {
          width: output.width,
          height: output.height,
          durationSeconds: selected.metadata.durationSeconds,
        },
        onProgress: (job) => {
          if (runRef.current !== runId) return
          setProgress(job.progress)
          setStage(job.stage)
        },
      })
      if (runRef.current !== runId) return
      onChange(media)
      setStage("complete")
    } catch (processError) {
      if (runRef.current !== runId) return
      setStage("failed")
      setError(readableError(processError, "This file could not be prepared."))
    }
  }

  const clear = () => {
    runRef.current += 1
    if (selected?.metadata?.previewUrl) URL.revokeObjectURL(selected.metadata.previewUrl)
    setSelected(null)
    setProgress(0)
    setStage("idle")
    setError("")
    onChange(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const previewUrl = selected?.metadata.previewUrl || value?.url
  const kind = selected?.metadata.kind || value?.kind || "image"
  const accept = allowVideo ? "image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm" : "image/png,image/jpeg,image/webp"

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !previewUrl && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!previewUrl && (event.key === "Enter" || event.key === " ")) inputRef.current?.click()
        }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { event.preventDefault(); setDragging(false) }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          void chooseFile(event.dataTransfer.files?.[0])
        }}
        className="overflow-hidden rounded-xl border-2 border-dashed transition"
        style={{
          borderColor: error ? "#ef4444" : dragging ? colors.green : colors.border,
          backgroundColor: dragging ? colors.greenSoft : colors.cardAlt,
        }}>
        {previewUrl ? (
          <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              {kind === "video" ? (
                <video src={previewUrl} controls muted className="h-full max-h-[480px] w-full object-contain" />
              ) : (
                <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: output.ratio, height: output.ratio < 1 ? 420 : "auto", width: output.ratio >= 1 ? "100%" : "auto", maxWidth: "100%" }}>
                  <img
                    src={previewUrl}
                    alt="Selected media preview"
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: `${positionX}% ${positionY}%`,
                      transform: `scale(${zoom})`,
                    }}
                  />
                  {output.ratio < 1 ? (
                    <>
                      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-slate-950/24 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/28 to-transparent" />
                      <div className="absolute bottom-16 left-4 right-16 rounded border border-dashed border-white/70 bg-slate-950/20 p-2 text-[10px] text-white">Keep important text and faces outside covered areas</div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">{selected?.file.name || "Saved media"}</p>
                <p className="mt-1 text-xs" style={{ color: colors.muted }}>
                  {selected ? `${selected.metadata.width} × ${selected.metadata.height} · ${formatBytes(selected.file.size)}` : `${value.width} × ${value.height} · ${formatBytes(value.sizeBytes)}`}
                </p>
                {selected?.metadata.kind === "video" ? (
                  <p className="mt-1 text-xs" style={{ color: colors.muted }}>{selected.metadata.durationSeconds.toFixed(1)} seconds</p>
                ) : null}
              </div>
              {selected?.metadata.kind === "image" && stage === "editing" ? (
                <>
                  <Range label="Zoom" min={1} max={2} step={0.01} value={zoom} onChange={setZoom} />
                  <Range label="Move left or right" min={0} max={100} value={positionX} onChange={setPositionX} />
                  <Range label="Move up or down" min={0} max={100} value={positionY} onChange={setPositionY} />
                  <p className="text-xs leading-5" style={{ color: colors.muted }}>Adjust the frame until the important part of the image is visible.</p>
                </>
              ) : selected?.metadata.kind === "video" && stage === "editing" ? (
                <div className="rounded-lg p-3 text-xs leading-5" style={{ backgroundColor: colors.greenSoft, color: colors.secondary }}>
                  Video trimming and 1080 × 1920 optimization will be performed by the backend later. This preview validates size and the 30-second limit.
                </div>
              ) : null}
              {stage === "uploading" || stage === "processing" ? (
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span>{stage === "processing" ? "Optimizing for mobile" : "Preparing upload"}</span>
                    <span className="font-semibold tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}
              {stage === "complete" || (value && !selected) ? (
                <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
                  ✓ Ready for this development preview · {output.label}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {selected && ["editing", "failed"].includes(stage) ? (
                  <button type="button" onClick={(event) => { event.stopPropagation(); void process() }} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white">
                    {stage === "failed" ? "Retry" : "Use this media"}
                  </button>
                ) : null}
                <button type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click() }} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ border: `1px solid ${colors.border}` }}>Replace</button>
                <button type="button" onClick={(event) => { event.stopPropagation(); clear() }} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-500">Remove</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-48 cursor-pointer flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full text-xl" style={{ backgroundColor: colors.greenSoft, color: colors.green }}>↑</div>
            <p className="font-semibold">{dragging ? "Drop your file here" : "Drag a file here or browse"}</p>
            <p className="mt-2 max-w-md text-xs leading-5" style={{ color: colors.muted }}>
              {allowVideo
                ? `Images: PNG, JPG, or WebP up to 15 MB. Videos: MP4, MOV, or WebM up to 30 seconds and 150 MB. Final frame: ${output.label}.`
                : `PNG, JPG, or WebP up to 15 MB. The image must be at least ${output.label}.`}
            </p>
            <button type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click() }} className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white">Browse files</button>
          </div>
        )}
      </div>
      <input ref={inputRef} hidden type="file" accept={accept} onChange={(event) => void chooseFile(event.target.files?.[0])} />
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  )
}

function Range({ label, min, max, step = 1, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="tabular-nums">{Number(value).toFixed(step < 1 ? 2 : 0)}</span></span>
      <input className="w-full accent-green-700" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function ActionEditor({ action, colors, products, vouchers, inputStyle, onChange }) {
  const [query, setQuery] = useState("")
  const source = action.type === "product"
    ? products.map((item) => ({ id: item.id, label: item.name, detail: item.category }))
    : action.type === "voucher"
      ? vouchers.map((item) => ({ id: item.id, label: item.code, detail: item.description }))
      : action.type === "feature"
        ? APP_FEATURES
        : []
  const options = source.filter((item) => `${item.label} ${item.detail || ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 24)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Tap action" help="Choose No action if the image is only informational.">
          <select
            value={action.type}
            onChange={(event) => { setQuery(""); onChange({ type: event.target.value, targetId: "", label: "" }) }}
            className="w-full rounded-lg px-3 py-2.5"
            style={inputStyle}>
            <option value="none">No action</option>
            <option value="product">Open a product</option>
            <option value="voucher">Open Cart with a voucher code</option>
            <option value="feature">Open an app feature</option>
          </select>
        </Field>
        {action.type !== "none" ? (
          <Field label="Search for the destination" help="Start typing, then choose one result below.">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${action.type === "feature" ? "app features" : `${action.type}s`}…`} className="w-full rounded-lg px-3 py-2.5" style={inputStyle} />
          </Field>
        ) : null}
      </div>
      {action.type !== "none" ? (
        <div className="grid max-h-56 grid-cols-1 gap-2 overflow-auto md:grid-cols-2">
          {options.length ? options.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ type: action.type, targetId: item.id, label: item.label })}
              className="rounded-lg p-3 text-left text-sm"
              style={{
                border: `1px solid ${action.targetId === item.id ? colors.green : colors.border}`,
                backgroundColor: action.targetId === item.id ? colors.greenSoft : "transparent",
              }}>
              <span className="font-semibold">{item.label}</span>
              {item.detail ? <span className="mt-1 block text-xs" style={{ color: colors.muted }}>{item.detail}</span> : null}
            </button>
          )) : <p className="text-sm" style={{ color: colors.muted }}>No matching options found.</p>}
        </div>
      ) : null}
    </div>
  )
}

function PreviewControls({ branch, tab, showTab, inputStyle, onBranch, onTab }) {
  return (
    <div className="mb-3 flex gap-2">
      <select value={branch} onChange={(event) => onBranch(event.target.value)} className="min-w-0 flex-1 rounded-lg px-2 py-2 text-xs" style={inputStyle}>
        {BRANCHES.filter((item) => item.value !== "all").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      {showTab ? (
        <select value={tab} onChange={(event) => onTab(event.target.value)} className="min-w-0 flex-1 rounded-lg px-2 py-2 text-xs" style={inputStyle}>
          {FEED_TABS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      ) : null}
    </div>
  )
}

function PhonePreview({ section, record }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[38px] bg-[#2f3437] p-2 shadow-xl ring-1 ring-black/10">
      <div className="relative aspect-[9/18.7] overflow-hidden rounded-[30px] bg-[#ededed]">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#171a1c]" />
        {section === "feed" ? <FeedPhonePreview record={record} /> : <BannerPhonePreview record={record} />}
      </div>
    </div>
  )
}

function FeedPhonePreview({ record }) {
  return (
    <div
      className="relative h-full overflow-hidden bg-[#eef1f0] text-white"
      style={{ fontFamily: '"Mobile Inter", sans-serif' }}>
      {record?.media?.kind === "video" ? (
        <video autoPlay loop muted playsInline src={record.media.url} className="absolute inset-0 h-full w-full object-cover" />
      ) : record?.media?.url ? (
        <img src={record.media.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-slate-200" />
      )}

      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/34 via-slate-950/10 to-transparent" />
      <div
        className="absolute inset-x-0 bottom-0 h-[58%]"
        style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(15,23,42,.12) 42%, rgba(15,23,42,.42) 76%, rgba(15,23,42,.72) 100%)" }}
      />

      <div className="absolute left-4 right-4 top-9 flex h-8 items-center justify-between">
        <img
          src={estingsMobileHeaderLogo}
          alt="Esting's Flower Shop"
          className="h-9 w-[172px] object-contain object-left [filter:drop-shadow(0_1px_2px_rgba(15,23,42,.32))]"
        />
        <StaticFeedIcon type="search" />
      </div>

      <div
        className="absolute left-4 right-4 top-[76px] grid h-8 grid-cols-3 text-center text-[11px] font-medium tracking-tight [text-shadow:0_1px_2px_rgba(15,23,42,.45)]"
        style={{ fontFamily: '"Mobile Inter Tight", sans-serif' }}>
        <span className="relative">
          EXPLORE
          <span className="absolute bottom-0 left-1/2 h-0.5 w-[54%] -translate-x-1/2 rounded-full bg-white" />
        </span>
        <span>WHAT&apos;S NEW</span>
        <span>FOR YOU</span>
      </div>

      <div className="absolute bottom-[94px] left-4 right-[76px] flex flex-col gap-2">
        {record?.badge ? (
          <span className="self-start rounded-full border border-white/35 bg-white/20 px-2.5 py-1 text-[10px] font-bold">
            {record.badge}
          </span>
        ) : null}
        <p className="text-[22px] font-extrabold leading-[27px] [text-shadow:0_1px_2px_rgba(15,23,42,.55)]">
          {record?.title || "Your post title"}
        </p>
        <p className="line-clamp-3 text-[12.5px] font-medium leading-[17px] text-white [text-shadow:0_1px_2px_rgba(15,23,42,.55)]">
          {record?.caption || "Your supporting caption appears here."}
        </p>
      </div>

      <div className="absolute bottom-[102px] right-1.5 flex w-[58px] flex-col items-center gap-2">
        <StaticFeedAction icon="heart" count={record?.likeCount || 0} label="Like" />
        <StaticFeedAction icon="share" label="Share" />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[72px] bg-slate-950/28 backdrop-blur-[1px]">
        <div className="mx-auto mt-3 flex max-w-[280px] items-start justify-between px-3 text-center text-[7px] font-medium text-white/85">
          <StaticBottomTab icon="home" label="Home" active />
          <StaticBottomTab icon="grid" label="Categories" />
          <StaticBottomTab icon="bag" label="Cart" />
          <StaticBottomTab icon="user" label="Me" />
        </div>
        <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white" />
      </div>
    </div>
  )
}

function StaticFeedAction({ icon, count, label }) {
  return (
    <div className="flex min-h-[46px] w-[58px] flex-col items-center justify-center gap-0.5">
      <StaticFeedIcon type={icon} size={27} />
      {typeof count === "number" ? <span className="text-[8px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.7)]">{formatPreviewCount(count)}</span> : null}
      <span className="text-[8px] font-medium leading-3 [text-shadow:0_1px_3px_rgba(0,0,0,.7)]">{label}</span>
    </div>
  )
}

function StaticBottomTab({ icon, label, active = false }) {
  return (
    <div className={`flex w-12 flex-col items-center gap-1 ${active ? "text-white" : "text-white/65"}`}>
      <StaticFeedIcon type={icon} size={18} />
      <span>{label}</span>
    </div>
  )
}

function StaticFeedIcon({ type, size = 22 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    store: <><path d="M3 9h18l-2-5H5L3 9Z" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

function formatPreviewCount(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function BannerPhonePreview({ record }) {
  return (
    <div className="h-full overflow-hidden bg-[#f5f5f5] text-[#1f2a24]" style={{ fontFamily: '"Mobile Inter", sans-serif' }}>
      <div className="border-b border-black/[.07] bg-white/90 pb-2 pt-9 backdrop-blur">
        <div className="flex h-[48px] items-center justify-between px-4">
          <img
            src={estingsMobileHeaderLogo}
            alt="Esting's Flower Shop"
            className="h-9 w-[174px] object-contain object-left"
            style={{ filter: "brightness(0) saturate(100%) invert(42%) sepia(18%) saturate(1667%) hue-rotate(78deg) brightness(91%) contrast(91%)" }}
          />
          <div className="text-[#2e8b34]"><StaticFeedIcon type="search" size={21} /></div>
        </div>
        <div className="flex justify-end px-4">
          <div className="flex h-8 items-center gap-1.5 rounded-full border border-green-700/20 bg-[#eefbf2] px-3 text-[10px] font-semibold text-[#2e8b34]">
            <StaticFeedIcon type="store" size={14} />
            Manila
          </div>
        </div>
      </div>

      <div className="bg-white">
        {record?.media?.url ? (
          <img src={record.media.url} alt={record.accessibleLabel || ""} className="aspect-[1080/500] w-full object-cover" />
        ) : (
          <div className="aspect-[1080/500] w-full bg-gradient-to-r from-[#315a49] to-[#7baa8c]" />
        )}
        <div className="flex h-7 items-center justify-center gap-1.5">
          <span className="h-1.5 w-[18px] rounded-full bg-[#2e8b34]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#cbd5e1]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#cbd5e1]" />
        </div>
      </div>

      <div className="space-y-3 px-4 pb-20 pt-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[14px] font-bold">Featured Products</p>
            <p className="mt-0.5 text-[8px] text-[#657168]">Handpicked blooms available in Manila</p>
          </div>
          <span className="text-[8px] font-semibold text-[#2e8b34]">View more</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <StaticCategoryProduct name="Blush Garden Bouquet" price="₱2,499" tone="from-[#ead8d8] to-[#d7b4b9]" />
          <StaticCategoryProduct name="Sunlit Tulip Wrap" price="₱1,899" tone="from-[#eee3c9] to-[#d7c380]" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[68px] border-t border-black/[.06] bg-white/95">
        <div className="mx-auto mt-2 flex max-w-[280px] items-start justify-between px-3 text-center text-[7px] font-medium">
          <StaticCategoryTab icon="home" label="Home" />
          <StaticCategoryTab icon="grid" label="Categories" active />
          <StaticCategoryTab icon="bag" label="Cart" />
          <StaticCategoryTab icon="user" label="Me" />
        </div>
        <div className="absolute bottom-1.5 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-slate-400" />
      </div>
    </div>
  )
}

function StaticCategoryProduct({ name, price, tone }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-white bg-white">
      <div className={`aspect-square bg-gradient-to-br ${tone}`} />
      <div className="space-y-1 p-2">
        <p className="line-clamp-2 text-[9px] font-medium leading-3">{name}</p>
        <p className="text-[10px] font-bold text-[#2e8b34]">{price}</p>
        <div className="flex items-center gap-0.5 text-[7px] text-[#c9ceca]">
          <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
          <span className="ml-0.5 text-[#8b948e]">(0)</span>
        </div>
      </div>
    </div>
  )
}

function StaticCategoryTab({ icon, label, active = false }) {
  return (
    <div className={`flex w-12 flex-col items-center gap-1 ${active ? "text-[#2e8b34]" : "text-[#7b847e]"}`}>
      <StaticFeedIcon type={icon} size={18} />
      <span>{label}</span>
    </div>
  )
}

function LegacyBannerPhonePreview({ record }) {
  return (
    <div className="h-full overflow-hidden bg-[#f5f5f5] text-slate-900">
      <div className="bg-white px-4 pb-4 pt-10">
        <div className="flex items-center justify-between text-xs font-bold text-green-800"><span>ESTING'S</span><span>⌕</span></div>
        <div className="mt-4 rounded-full bg-slate-100 px-4 py-2 text-[10px] text-slate-400">Search flowers and gifts</div>
      </div>
      <div className="mt-3">
        {record?.media?.url ? (
          <img src={record.media.url} alt={record.accessibleLabel || ""} className="aspect-[1080/500] w-full object-cover" />
        ) : (
          <div className="aspect-[1080/500] w-full bg-gradient-to-r from-green-900 to-emerald-600" />
        )}
        <div className="mt-2 flex justify-center gap-1"><span className="h-1.5 w-4 rounded-full bg-green-700" /><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /></div>
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-28 rounded bg-slate-300" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-xl bg-white shadow-sm" />)}
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-black" />
    </div>
  )
}
