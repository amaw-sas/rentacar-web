#!/usr/bin/env bash
# Verifica que cada cita archivo:línea del design doc de #366 apunte a lo que el doc afirma.
# Uso: bash verify-citations.sh   (desde la raíz del worktree)
set -uo pipefail

pass=0; fail=0

# check <archivo> <linea-inicio> <linea-fin> <regex-esperado> <etiqueta>
check() {
  local file="$1" from="$2" to="$3" re="$4" label="$5"
  if [[ ! -f "$file" ]]; then
    printf 'FAIL  %-58s archivo inexistente: %s\n' "$label" "$file"; ((fail++)); return
  fi
  if sed -n "${from},${to}p" "$file" | grep -qE "$re"; then
    printf 'ok    %-58s %s:%s\n' "$label" "$file" "$from"; ((pass++))
  else
    printf 'FAIL  %-58s %s:%s-%s no contiene /%s/\n' "$label" "$file" "$from" "$to" "$re"; ((fail++))
  fi
}

A=packages/ui-alquicarros
L=packages/logic/src

# --- Diagnóstico ---
check $A/app/components/wizard/WizardSummary.vue 174 174 'ctaDisabled.*canAdvance.*isSubmittingForm.*formSubmitLocked' 'WizardSummary:174 gate triple'
check $A/app/components/wizard/ReservationWizard.vue 362 362 'formValid: Boolean\(politicaPrivacidad' 'ReservationWizard:362 formValid'
check $L/stores/useStoreReservationForm.ts 349 357 'formSubmitLocked\.value = true' 'store:349-357 levanta el lock'
check $L/stores/useStoreReservationForm.ts 349 349 'SCEN-322-E03' 'store:349 ancla del test posicional'
check packages/ui-alquilatucarro/app/components/CategorySelectionSection.vue 240 240 'isSubmittingForm \|\| formSubmitLocked' 'atc:240 CTA sin gate de consentimiento'
check $L/composables/useMessages.ts 150 152 'codeHint' 'useMessages:150-152 codeHint excluyente'

# --- D1 ---
check $A/app/composables/useReservationWizard.ts 122 122 "case 'datos'" 'canAdvance case datos'
check $A/app/components/wizard/ReservationWizard.vue 378 387 'function onNext' 'onNext:378-387'
check $A/app/components/wizard/ReservationWizard.vue 106 106 'politicaPrivacidad' 'storeToRefs huérfano tras D1'
check $A/app/components/wizard/ReservationWizard.vue 336 349 'hasUsableCategory' 'red de seguridad usa hasUsableCategory'
check $A/tests/reservation-wizard-machine.test.ts 187 190 "canAdvance\('datos'" 'test unitario que D1 reescribe'
check e2e/pricing-horizon-alquicarros.spec.ts 81 81 'toBeDisabled' 'pricing-horizon:81 (por qué NO tocar ctaDisabled)'
check e2e/pricing-horizon-alquicarros.spec.ts 102 102 'toBeDisabled' 'pricing-horizon:102 deep-link beyond-horizon'

# --- D2 ---
check $A/app/components/wizard/WizardSummary.vue 58 58 'wizard-continue-desktop-test' 'testid CTA desktop'
check $A/app/components/wizard/WizardSummary.vue 128 128 'wizard-continue-mobile-test' 'testid CTA móvil'

# --- D4 / D7 ---
check $L/stores/useStoreReservationForm.ts 140 140 'formSubmitLocked' 'store:140 declaración del lock'
check $L/stores/useStoreReservationForm.ts 417 417 'formSubmitLocked' 'store:417 export del lock'
check $L/stores/useStoreSearchData.ts 81 81 'storeForm\.formSubmitLocked = false' 'D7: el lock SÍ se limpia en search()'
check $L/composables/useSearchByRouteParams.ts 75 75 'doSearch' 'D7: entrada PATH'
check $A/app/composables/useSearchByQueryParams.ts 147 148 'canReuseExistingSearch|doSearch' 'D7: entrada query + early return'
check $L/composables/useSearch.ts 213 213 'search\(' 'D7: convergencia en useSearch:213'
check $L/stores/useStoreSearchData.ts 307 318 'checkoutTrackedForCategory|item_id' 'riesgo analítica descartado'

# --- D5 ---
check $A/app/components/wizard/steps/StepVehicle.vue 195 195 "phone: '3187703670'" 'literal hardcodeado'
check $A/app/components/wizard/steps/StepVehicle.vue 38 38 'wa\.me' 'ancla WhatsApp 1'
check $A/app/components/wizard/steps/StepVehicle.vue 103 103 'wa\.me' 'ancla WhatsApp 2'
check $A/app/app.config.ts 49 50 'phone|whatsapp' 'app.config franchise'
check $A/app/error.vue 76 76 'franchise\.whatsapp' 'patrón ya usado en la marca'
check $A/tests/contact-number.test.ts 52 55 'StepVehicle' 'test que D5 reescribe'

# --- D6 ---
check $A/app/components/ReservationForm.vue 95 122 'politicaPrivacidad' 'consentimiento es el último campo'
check $A/app/components/ReservationForm.vue 74 77 'useFormField' 'desconexión VueTelInput documentada'
check $L/composables/usePhoneField.ts 34 34 'telefono' 'id determinista del teléfono'
check $A/app/components/__tests__/ReservationForm.test.ts 11 11 'u-form' 'regex que exige handler nombrado'
check $A/app/components/wizard/ReservationWizard.vue 223 228 'scrollTo' 'scroll al tope al entrar al paso'

# --- Holdout #311 + CI ---
check docs/specs/2026-07-16-issue-311-consentimiento-datos/scenarios/consentimiento-datos-pre-marcado.scenarios.md 48 48 'deshabilitado' 'SCEN-311-03 codifica el mecanismo'
check e2e/alquicarros-reservation-wizard.spec.ts 225 227 'toBeDisabled' 'aserto e2e que la enmienda reescribe'
check e2e/reservation-privacy-consent.spec.ts 116 120 'record' 'patrón contador de requests'
check .github/workflows/ci.yml 206 207 'alquicarros-reservation-wizard' 'CI solo corre 2 specs de la marca'

# --- node_modules (versión-dependiente) ---
NUI=$(find node_modules/.pnpm -path '*@nuxt/ui/dist/runtime/components/Button.vue' 2>/dev/null | head -1)
if [[ -n "$NUI" ]]; then
  check "$NUI" 118 118 'disabled \|\| isLoading' 'Button:118 loading implica disabled'
  check "$NUI" 134 134 'leadingIcon' 'Button:134 slot del spinner'
  check "${NUI%Button.vue}Form.vue" 149 167 'emit\("error"|emits\("error"' 'Form:149-167 solo emite @error'
else
  printf 'FAIL  %-58s no se localizó @nuxt/ui Button.vue\n' 'node_modules'; ((fail++))
fi

echo
echo "citas verificadas: $pass  ·  fallidas: $fail"
[[ $fail -eq 0 ]]
