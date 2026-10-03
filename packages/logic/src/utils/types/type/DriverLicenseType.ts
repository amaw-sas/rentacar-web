// Origin of the customer's driver license. Lowercase on purpose: unlike
// IdentificationType these values never travel on the wire — the field is
// UI-only (it decides the pickup-document notice and nothing else).
export type DriverLicenseType = "colombiana" | "extranjera";
