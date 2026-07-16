export default interface PhoneInputOptionsType {
  showDialCode: boolean;
  id: string;
  name: string;
  placeholder: string;
  autocomplete: string;
  // Forwarded by vue-tel-input to its native <input>. Set while the telefono
  // field has a visible validation error (issue #322 SCEN-322-X01).
  'aria-describedby'?: string;
}
