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
export { citiesConfig, type City, type Testimonial } from './cities.config';
export { tarifasConfig, type TarifaGama, type TarifaPlan, type TarifasConfig } from './tarifas.config';
