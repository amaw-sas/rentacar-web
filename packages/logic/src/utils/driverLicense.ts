import type { DriverLicenseType } from './types/type/DriverLicenseType';

// Single source for the license question across the three brand forms. The
// notice is UI-only: it tells the customer which ID document to bring to the
// branch, and it is independent of the REGISTRATION document — a customer may
// register with a cédula and show up with the passport. Never add this field
// to the reservation payload (useRecordReservationForm).
export const DRIVER_LICENSE_OPTIONS = [
  { value: 'colombiana', label: 'Colombiana' },
  { value: 'extranjera', label: 'Extranjera' },
] as const;

const PICKUP_DOCUMENT_NOTICES: Record<DriverLicenseType, string> = {
  colombiana:
    'Al recoger el carro deberás presentar tu cédula colombiana. No se acepta pasaporte ni cédula de extranjería si presentas una licencia de conducción colombiana.',
  extranjera:
    'Al recoger el carro deberás presentar tu pasaporte o cédula de extranjería. No se acepta la cédula colombiana si presentas una licencia de conducción extranjera.',
};

export function driverLicenseNotice(
  tipo: DriverLicenseType | null | undefined,
): string | null {
  return tipo ? PICKUP_DOCUMENT_NOTICES[tipo] : null;
}
