/**
 * Shared configuration exports
 *
 * This module exports all shared configuration that can be used across
 * multiple brands in the monorepo architecture.
 */

export { defaultConfig } from './defaults.config';
export { uiConfig } from './ui.config';
export { organizationConfig } from './organization.config';
// cities.config.ts removido en issue #6 — cities ahora viaja vía
// useFetchRentacarData → /api/rentacar-data → Supabase. City y Testimonial
// types se re-exportan desde utils/index.ts apuntando a types/type/.
