import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Verify Firebase has been removed from the project configuration.
 * These are infrastructure-level assertions — not runtime tests.
 */
test.describe('Firebase cleanup verification', () => {
  const root = resolve(__dirname, '..');

  test('firebase.json should not exist', () => {
    expect(existsSync(resolve(root, 'firebase.json'))).toBe(false);
  });

  test('.firebaserc should not exist', () => {
    expect(existsSync(resolve(root, '.firebaserc'))).toBe(false);
  });

  test('package.json should not contain firebase dependencies', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps['firebase-admin']).toBeUndefined();
    expect(allDeps['firebase-functions']).toBeUndefined();
    expect(allDeps['better-sqlite3']).toBeUndefined();
  });

  test('nuxt.config.ts files should not have firebase preset', () => {
    const brands = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'];
    for (const brand of brands) {
      const configPath = resolve(root, 'packages', brand, 'nuxt.config.ts');
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        expect(content).not.toContain('preset: "firebase"');
        expect(content).not.toContain("preset: 'firebase'");
      }
    }
  });

  test('nuxt.config.ts files should have supabase runtimeConfig', () => {
    const brands = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'];
    for (const brand of brands) {
      const configPath = resolve(root, 'packages', brand, 'nuxt.config.ts');
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        expect(content).toContain('supabaseUrl');
        expect(content).toContain('supabaseAnonKey');
      }
    }
  });

  test('nuxt.config.ts files should have ISR route rules for city pages', () => {
    const brands = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'];
    const expectedCities = ['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena'];
    for (const brand of brands) {
      const configPath = resolve(root, 'packages', brand, 'nuxt.config.ts');
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        expect(content).toContain("'/': { isr: 3600 }");
        for (const city of expectedCities) {
          expect(content).toContain(`'/${city}': { isr: 3600 }`);
        }
      }
    }
  });
});
