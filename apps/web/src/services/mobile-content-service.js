import { API_BASE } from "../config/api"
import { api } from "./api"

const STORAGE_KEY = "bloomora.mobile-content.mock.v2"

export const FEED_TABS = [
  { value: "explore", label: "Explore" },
  { value: "new", label: "What's New" },
  { value: "for-you", label: "For You" },
]

export const BRANCHES = [
  { value: "all", label: "All branches" },
  { value: "manila", label: "Manila" },
  { value: "pampanga", label: "Pampanga" },
]

export const APP_FEATURES = [
  { id: "categories", label: "Categories", route: "/categories" },
  { id: "create", label: "Create a bouquet", route: "/(tabs)/generate" },
  { id: "wishlist", label: "Wishlist", route: "/wishlist" },
  { id: "orders", label: "My orders", route: "/(tabs)/orders" },
  { id: "live-chat", label: "Live chat", route: "/live-chat" },
]

const configuredMode = import.meta.env.VITE_MOBILE_CONTENT_MODE
const mockEnabled = configuredMode === "mock" || (!configuredMode && import.meta.env.DEV)

function errorMessageFromPayload(payload, fallback) {
  const detail = payload?.detail ?? payload?.message ?? payload?.error
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
  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail)
  }
  if (payload && typeof payload === "object") return JSON.stringify(payload)
  return fallback
}

const initialState = {
  feedPosts: [],
  banners: [],
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadState() {
  if (!mockEnabled) return clone(initialState)
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY)
    return stored ? { ...clone(initialState), ...JSON.parse(stored) } : clone(initialState)
  } catch {
    return clone(initialState)
  }
}

function saveState(state) {
  if (!mockEnabled) {
    throw new Error("Mock Mobile Content storage is disabled in production.")
  }
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
}

function nextId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`
}

function upsert(collection, record, prefix) {
  const nextRecord = { ...record, id: record.id || nextId(prefix) }
  const index = collection.findIndex((item) => item.id === nextRecord.id)
  if (index >= 0) collection[index] = nextRecord
  else collection.push(nextRecord)
  return nextRecord
}

function apiPayload(record) {
  const payload = { ...record }
  if (!payload.id) delete payload.id
  if (payload.media && !payload.media.id) {
    payload.media = { ...payload.media }
    delete payload.media.id
  }
  return payload
}

export const mockMobileContentService = {
  mode: "mock",

  async listFeedPosts() {
    return loadState().feedPosts.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async saveFeedPost(post) {
    const state = loadState()
    const saved = upsert(state.feedPosts, post, "feed")
    saveState(state)
    return saved
  },

  async deleteFeedPost(id) {
    const state = loadState()
    state.feedPosts = state.feedPosts.filter((item) => item.id !== id)
    saveState(state)
  },

  async reorderFeedPosts(ids) {
    const state = loadState()
    state.feedPosts = state.feedPosts.map((item) => {
      const index = ids.indexOf(item.id)
      return index >= 0 ? { ...item, sortOrder: (index + 1) * 10 } : item
    })
    saveState(state)
  },

  async listBanners() {
    return loadState().banners.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async saveBanner(banner) {
    const state = loadState()
    const saved = upsert(state.banners, banner, "banner")
    saveState(state)
    return saved
  },

  async deleteBanner(id) {
    const state = loadState()
    state.banners = state.banners.filter((item) => item.id !== id)
    saveState(state)
  },

  async reorderBanners(ids) {
    const state = loadState()
    state.banners = state.banners.map((item) => {
      const index = ids.indexOf(item.id)
      return index >= 0 ? { ...item, sortOrder: (index + 1) * 10 } : item
    })
    saveState(state)
  },

  async simulateMediaJob({ file, kind, output, onProgress }) {
    const jobId = nextId("media-job")
    for (const progress of [8, 19, 34, 51, 68, 82, 91, 96, 100]) {
      await new Promise((resolve) => setTimeout(resolve, progress < 91 ? 90 : 140))
      onProgress?.({
        id: jobId,
        progress,
        stage: progress < 82 ? "uploading" : progress < 100 ? "processing" : "complete",
      })
    }
    return {
      id: nextId("media"),
      kind,
      url: URL.createObjectURL(file),
      posterUrl: null,
      width: output.width,
      height: output.height,
      durationSeconds: output.durationSeconds ?? null,
      mimeType: kind === "video" ? "video/mp4" : "image/webp",
      sizeBytes: Math.min(file.size, kind === "video" ? 18_000_000 : 2_500_000),
      developmentPreview: true,
    }
  },
}

export const apiMobileContentService = {
  mode: "api",
  async listFeedPosts() {
    return api.get("/mobile-content/admin/feed-posts")
  },
  async saveFeedPost(post) {
    const payload = apiPayload(post)
    return post.id
      ? api.put(`/mobile-content/admin/feed-posts/${encodeURIComponent(post.id)}`, payload)
      : api.post("/mobile-content/admin/feed-posts", payload)
  },
  async deleteFeedPost(id) {
    return api.delete(`/mobile-content/admin/feed-posts/${encodeURIComponent(id)}`)
  },
  async reorderFeedPosts(ids) {
    return api.put("/mobile-content/admin/feed-posts/reorder", { ids })
  },
  async listBanners() {
    return api.get("/mobile-content/admin/banners")
  },
  async saveBanner(banner) {
    const payload = apiPayload(banner)
    return banner.id
      ? api.put(`/mobile-content/admin/banners/${encodeURIComponent(banner.id)}`, payload)
      : api.post("/mobile-content/admin/banners", payload)
  },
  async deleteBanner(id) {
    return api.delete(`/mobile-content/admin/banners/${encodeURIComponent(id)}`)
  },
  async reorderBanners(ids) {
    return api.put("/mobile-content/admin/banners/reorder", { ids })
  },
  async simulateMediaJob({ file, output, onProgress }) {
    const contentType = output.width === 1080 && output.height === 500 ? "banner" : "feed"
    const formData = new FormData()
    formData.append("content_type", contentType)
    formData.append("file", file)
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.open("POST", `${API_BASE}/mobile-content/media`)
      const token = globalThis.localStorage?.getItem("access_token")
      if (token) request.setRequestHeader("Authorization", `Bearer ${token}`)
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        const progress = Math.min(90, Math.round((event.loaded / event.total) * 90))
        onProgress?.({ progress, stage: "uploading" })
      }
      request.upload.onload = () => onProgress?.({ progress: 92, stage: "processing" })
      request.onerror = () => reject(new Error("Unable to connect to the media server."))
      request.onload = () => {
        let payload = null
        try {
          payload = JSON.parse(request.responseText || "{}")
        } catch {
          payload = null
        }
        if (request.status < 200 || request.status >= 300) {
          reject(new Error(errorMessageFromPayload(payload, "The media could not be processed.")))
          return
        }
        onProgress?.({ progress: 100, stage: "complete" })
        resolve(payload)
      }
      request.send(formData)
    })
  },
}

export const mobileContentService = mockEnabled ? mockMobileContentService : apiMobileContentService
export const isMockMobileContent = mobileContentService.mode === "mock"
