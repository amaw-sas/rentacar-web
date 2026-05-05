/**
 * Shared configuration exports
 *
 * This module exports all shared configuration that can be used across
 * multiple brands in the monorepo architecture.
 */

export { defaultConfig } from './defaults.config';
export { uiConfig } from './ui.config';
export { organizationConfig } from './organization.config';
export { faqsConfig, type FAQ } from './faqs.config';
// cities.config.ts: re-exports removidos en Step 8 — cities ahora viaja vía
// useFetchRentacarData (issue #6). City y Testimonial types se re-exportan
// desde utils/index.ts apuntando a types/type/. cities.config.ts seguirá
// existiendo hasta Step 9 como input de scripts/cities-snapshot.ts.
