export function parseImageQualityConfig(nuxtConfig: string): {
  defaultQuality: number
  allowedQualities: number[]
} {
  const defaultMatch = nuxtConfig.match(/\bimage:\s*\{[\s\S]*?\bquality:\s*(\d+)/)
  const allowedMatch = nuxtConfig.match(
    /nitroConfig\.vercel\.config\.images\s*=\s*\{[\s\S]*?\bqualities:\s*\[([^\]]*)\]/,
  )

  if (!defaultMatch?.[1] || !allowedMatch?.[1]) {
    throw new Error('Unable to read the Nuxt image quality and Vercel qualities whitelist')
  }

  return {
    defaultQuality: Number(defaultMatch[1]),
    allowedQualities: [...allowedMatch[1].matchAll(/\b\d+\b/g)].map(match => Number(match[0])),
  }
}

export function findNuxtImgTag(source: string, imageSource: string): string {
  const tag = (source.match(/<NuxtImg\b[\s\S]*?>/g) ?? [])
    .find(candidate => candidate.includes(imageSource))

  if (!tag) throw new Error(`Unable to find NuxtImg for ${imageSource}`)
  return tag
}

export function effectiveNuxtImgQuality(tag: string, defaultQuality: number): number {
  const explicitQuality = tag.match(/\b:?quality\s*=\s*["'](\d+)["']/)?.[1]
  return explicitQuality ? Number(explicitQuality) : defaultQuality
}
