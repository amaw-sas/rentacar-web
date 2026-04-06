interface VueTelInputCountry {
  name: string;
  iso2: string;
  dialCode: string;
  areaCodes: any | null;
}

export default interface VueTelInputPhoneObject {
  country: VueTelInputCountry | undefined;
  countryCallingCode?: string | undefined;
  nationalNumber?: string | undefined;
  number?: string | undefined;
  __countryCallingCodeSource?: string | undefined;
  countryCode: string | undefined;
  valid: boolean | undefined;
  formatted: string | undefined;
}
