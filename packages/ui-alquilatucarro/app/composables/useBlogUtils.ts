import type { BlogCategory } from '@rentacar-main/logic/src'

const CATEGORY_LABELS: Record<string, string> = {
  guias: 'Guías',
  destinos: 'Destinos',
  tips: 'Tips',
  rutas: 'Rutas'
}

const CATEGORY_ICONS: Record<string, string> = {
  guias: 'i-lucide-book-open',
  destinos: 'i-lucide-map-pin',
  tips: 'i-lucide-lightbulb',
  rutas: 'i-lucide-route'
}

export function useBlogUtils() {
  function formatDate(dateStr: string): string {
    // Parse date parts manually to avoid UTC→local timezone shift
    // new Date('2025-12-18') = UTC midnight → COT (UTC-5) = Dec 17
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function formatCategory(category: string): string {
    return CATEGORY_LABELS[category] || category
  }

  function getCategoryIcon(category: string): string {
    return CATEGORY_ICONS[category] || 'i-lucide-file-text'
  }

  /**
   * Resolve an image URL — if already absolute (starts with http), return as-is.
   * Otherwise prepend the site base URL.
   */
  function resolveImageUrl(imageUrl: string | undefined, baseUrl: string): string {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http')) return imageUrl
    return `${baseUrl}${imageUrl}`
  }

  return { formatDate, formatCategory, getCategoryIcon, resolveImageUrl }
}
