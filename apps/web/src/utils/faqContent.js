export const FAQ_SETTINGS_PATH = "/faqs"
export const FAQ_ADMIN_PATH = "/faqs/admin"
export const FAQ_UPDATED_EVENT = "bloomora:faq-updated"

function normalizeSettingsBlob(settings) {
  if (typeof settings === "string") {
    try {
      const parsed = JSON.parse(settings)
      return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
      return {}
    }
  }
  return settings && typeof settings === "object" ? settings : {}
}

export function faqCategoriesFromSettings(settings) {
  const blob = normalizeSettingsBlob(settings)
  const source = Array.isArray(blob) ? blob : blob.__faq__
  if (!Array.isArray(source)) return null

  return source
    .filter(category => category && typeof category === "object")
    .map((category, categoryIndex) => ({
      ...category,
      id: category.id || `faq-category-${categoryIndex}`,
      category: String(category.category || "FAQ").trim() || "FAQ",
      items: (Array.isArray(category.items) ? category.items : [])
        .filter(item => item && String(item.q || "").trim() && String(item.a || "").trim())
        .map((item, itemIndex) => ({
          ...item,
          id: item.id || `faq-item-${categoryIndex}-${itemIndex}`,
          q: String(item.q).trim(),
          a: String(item.a).trim(),
        })),
    }))
}

export function faqQuestions(categories) {
  const seen = new Set()
  return (categories || []).flatMap(category => category.items || []).reduce((questions, item) => {
    const question = String(item.q || "").trim()
    const key = question.toLocaleLowerCase()
    if (question && !seen.has(key)) {
      seen.add(key)
      questions.push(question)
    }
    return questions
  }, [])
}

export async function loadFaqCategories(api) {
  const settings = await api.get(`${FAQ_SETTINGS_PATH}?_=${Date.now()}`)
  const categories = faqCategoriesFromSettings(settings)
  return categories?.length ? categories : null
}
