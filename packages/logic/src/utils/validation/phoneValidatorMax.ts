// The only static import of libphonenumber-js in the app, reached solely through
// the dynamic import in ./phoneValidator. Named imports let the bundler keep just
// these two functions plus the full metadata; a dynamic import of
// 'libphonenumber-js/max' itself would pull the whole module namespace.
export { isValidPhoneNumber, validatePhoneNumberLength } from 'libphonenumber-js/max';
