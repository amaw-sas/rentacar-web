/**
 * Type declarations for Nuxt auto-imported composables
 *
 * This file provides type definitions for composables that are
 * auto-imported by Nuxt in consuming applications but need to be
 * declared for TypeScript when typechecking this layer in isolation.
 */

import type { AppConfig as NuxtAppConfig } from 'nuxt/schema'

// Extended AppConfig with franchise information
interface AppConfig extends NuxtAppConfig {
  franchise: {
    name: string
    shortname: string
    website: string
    title: string
    description: string
    logo: string
    oglogo?: string
    svglogo?: string
    ogImage: string
    phone: string
    whatsapp: string
    email: string
    socialmedia: string[]
    footerLinks: Array<{ link: string; label: string }>
    testimonials: any[]
    [key: string]: any
  }
  [key: string]: any
}
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type { UseSeoMetaInput } from '@unhead/schema'
import type { UseHeadInput } from '@unhead/vue'

declare global {
  // Nuxt App Config
  function useAppConfig(): AppConfig

  // Vue Router
  function useRoute(): RouteLocationNormalizedLoaded
  function useRouter(): Router
  function navigateTo(to: any, options?: any): Promise<void>

  // Nuxt Runtime Config
  function useRuntimeConfig(): any

  // SEO & Head Management
  function useSeoMeta(input: UseSeoMetaInput): void
  function useHead(input: UseHeadInput): void

  // Schema.org (from @unhead/schema-org)
  function useSchemaOrg(schema: any): void
  function defineWebSite(schema: any): any
  function defineWebPage(schema: any): any
  function defineOrganization(schema: any): any
  function defineQuestion(schema: any): any

  // Nuxt UI Toast
  const useToast: () => {
    add: (toast: any) => void
    remove: (id: string) => void
    clear: () => void
  }
}

export {}
