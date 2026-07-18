/**
 * Vercel only emits requested widths that are present in `image.screens`.
 * Keep the exact responsive candidates here so the URL's `w` parameter and
 * its srcset descriptor cannot silently diverge through provider rounding.
 */
export const imageScreens = {
  avatar: 32,
  avatar2x: 64,
  bioAvatar: 80,
  bioAvatar2x: 160,
  xs: 320,
  card: 400,
  heroCar: 480,
  featured1125: 560,
  featured: 600,
  legacyBlog: 626,
  sm: 640,
  md: 768,
  card2x: 800,
  heroCar2x: 960,
  lg: 1024,
  featured1125_2x: 1120,
  legacyBlogWide: 1125,
  blog: 1200,
  xl: 1280,
  xxl: 1536,
  '2xl': 1536,
} as const
