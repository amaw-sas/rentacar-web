/**
 * Emisoras de radio por ciudad para la sección "Emisoras más escuchadas en
 * {ciudad}" de las páginas de ciudad (solo alquilatucarro). Datos fijos,
 * curados desde emisorasdecolombia.com. Keyed por `city.id` (el slug).
 *
 * Floridablanca / Palmira / Soledad no tienen emisoras propias en la fuente:
 * usan las de su ciudad vecina (Bucaramanga / Cali / Barranquilla). `nearbyOf`
 * deja constancia para que la sección pueda titular "en el área de {vecina}".
 *
 * `logo` es opcional: cuando falta, la tarjeta muestra un círculo con la
 * inicial. La imagen carga lazy y, si el host falla, cae al mismo fallback.
 */
export interface RadioStation {
  name: string;
  /** "89.4 FM" / "1040 AM" / "En vivo" (online sin dial fijo) */
  frequency: string;
  /** Página de la emisora; abre en pestaña nueva */
  url: string;
  /** Logo absoluto; ausente → fallback con la inicial */
  logo?: string;
}

export interface CityRadio {
  stations: RadioStation[];
  /** Nombre de la ciudad vecina cuyas emisoras se reutilizan (si aplica) */
  nearbyOf?: string;
}

const armenia: RadioStation[] = [
  { name: 'Armenia Stereo', frequency: '89.4 FM', url: 'https://emisorasdecolombia.com/armenia/armenia-stereo-894-fm.html' },
  { name: 'Bésame Armenia', frequency: '90.7 FM', url: 'https://emisorasdecolombia.com/armenia/besame-907-fm-armenia.html', logo: 'https://emisorasdecolombia.com/img/logos/besame-v2.webp' },
  { name: 'La Súper Estación Latina', frequency: '104.1 FM', url: 'https://emisorasdecolombia.com/armenia/la-super-estacion-latina-1041-armenia.html' },
];

const barranquilla: RadioStation[] = [
  { name: 'Barranquilla Estéreo', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/barranquilla/barranquilla-estereo.html', logo: 'https://emisorasdecolombia.com/img/logos/barranquilla-estereo.webp' },
  { name: 'Mi Vallenatísima', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/barranquilla/mivallenatisima.html', logo: 'https://emisorasdecolombia.com/img/logos/mivallenatisima.webp' },
  { name: 'Radio Tiempo Barranquilla', frequency: '96.1 FM', url: 'https://emisorasdecolombia.com/barranquilla/radio-tiempo-barranquilla.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-tiempo.webp' },
];

const bucaramanga: RadioStation[] = [
  { name: 'Bésame Bucaramanga', frequency: '104.7 FM', url: 'https://emisorasdecolombia.com/bucaramanga/besame-1047-fm-bucaramanga.html', logo: 'https://emisorasdecolombia.com/img/logos/besame-v2.webp' },
  { name: 'Olímpica Stereo Bucaramanga', frequency: '97.7 FM', url: 'https://emisorasdecolombia.com/bucaramanga/olimpica-stereo-bucaramanga-977-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/olimpica-stereo.webp' },
  { name: 'Charalá Estéreo', frequency: '103.2 FM', url: 'https://emisorasdecolombia.com/bucaramanga/charala-estereo-1032-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/charala-estereo-1032-fm.webp' },
];

const cali: RadioStation[] = [
  { name: 'Tropicana Cali', frequency: '93.1 FM', url: 'https://emisorasdecolombia.com/cali/tropicana-cali-931-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/tropicana.webp' },
  { name: 'La X Cali', frequency: '96.5 FM', url: 'https://emisorasdecolombia.com/cali/la-x-965-cali.html', logo: 'https://emisorasdecolombia.com/img/logos/la-x-965-cali.webp' },
  { name: 'Olímpica Stéreo Cali', frequency: '104.5 FM', url: 'https://emisorasdecolombia.com/cali/olimpica-stereo-1045-cali.html', logo: 'https://emisorasdecolombia.com/img/logos/olimpica-stereo.webp' },
];

export const radioStationsByCity: Record<string, CityRadio> = {
  armenia: { stations: armenia },
  barranquilla: { stations: barranquilla },
  bogota: {
    stations: [
      { name: 'Blu Radio Bogotá', frequency: '89.9 FM', url: 'https://emisorasdecolombia.com/bogota/blu-radio-bogota-899-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/blu-radio.webp' },
      { name: 'Caracol Radio Bogotá', frequency: '100.9 FM', url: 'https://emisorasdecolombia.com/bogota/caracol-radio-bogota-1009-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/caracol-radio.webp' },
      { name: 'La Kalle Bogotá', frequency: '96.9 FM', url: 'https://emisorasdecolombia.com/bogota/la-kalle-bogota-969-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-kalle.webp' },
    ],
  },
  bucaramanga: { stations: bucaramanga },
  cali: { stations: cali },
  cartagena: {
    stations: [
      { name: 'Radio Tiempo Cartagena', frequency: '88.5 FM', url: 'https://emisorasdecolombia.com/cartagena/radio-tiempo-cartagena-colombia.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-tiempo.webp' },
      { name: 'Olímpica Stereo Cartagena', frequency: '90.5 FM', url: 'https://emisorasdecolombia.com/cartagena/olimpica-stereo-905-fm-cartagena.html', logo: 'https://emisorasdecolombia.com/img/logos/olimpica-stereo.webp' },
      { name: 'La Reina Cartagena', frequency: '95.5 FM', url: 'https://emisorasdecolombia.com/cartagena/la-reina-cartagena-955-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-reina.webp' },
    ],
  },
  cucuta: {
    stations: [
      { name: 'Bésame Cúcuta', frequency: '100.7 FM', url: 'https://emisorasdecolombia.com/cucuta/besame-1007-fm-cucuta.html', logo: 'https://emisorasdecolombia.com/img/logos/besame-v2.webp' },
      { name: 'La Voz del Norte', frequency: '1040 AM', url: 'https://emisorasdecolombia.com/cucuta/la-voz-del-norte-1040-am.html', logo: 'https://emisorasdecolombia.com/img/logos/la-voz-del-norte-1040-am.webp' },
    ],
  },
  floridablanca: { stations: bucaramanga, nearbyOf: 'Bucaramanga' },
  ibague: {
    stations: [
      { name: 'Ecos del Combeima', frequency: '790 AM', url: 'https://emisorasdecolombia.com/ibague/ecos-del-combeima-hjnc-790-khz-am-ibague-tolima.html', logo: 'https://emisorasdecolombia.com/img/logos/ecos-del-combeima-hjnc-790-khz-am-ibague-tolima.webp' },
      { name: 'Radio Cristiano Bíblico', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/ibague/radio-cristiano-biblico.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-cristiano-biblico.webp' },
      { name: 'Ondas de Ibagué', frequency: '1470 AM', url: 'https://emisorasdecolombia.com/ibague/ondas-de-ibague-1470-am.html', logo: 'https://emisorasdecolombia.com/img/logos/ondas-de-ibague-1470-am.webp' },
    ],
  },
  manizales: {
    stations: [
      { name: 'Colombia Salsa Dura', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/manizales/colombia-salsa-dura.html' },
      { name: 'Colombia Crossover', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/manizales/colombia-crossover.html' },
      { name: 'Colombia Urbana', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/manizales/colombia-urbana.html' },
    ],
  },
  medellin: {
    stations: [
      { name: 'Olímpica Stereo Medellín', frequency: '104.9 FM', url: 'https://emisorasdecolombia.com/medellin/olimpica-stereo-medellin-1049-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/olimpica-stereo.webp' },
      { name: 'La Mega Medellín', frequency: '92.9 FM', url: 'https://emisorasdecolombia.com/medellin/la-mega-medellin-929-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-mega.webp' },
      { name: 'Bésame Medellín', frequency: '94.9 FM', url: 'https://emisorasdecolombia.com/medellin/besame-medellin-949-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/besame-v2.webp' },
    ],
  },
  monteria: {
    stations: [
      { name: 'Olímpica Stereo Montería', frequency: '90.5 FM', url: 'https://emisorasdecolombia.com/monteria/olimpica-stereo-905-fm-monteria.html', logo: 'https://emisorasdecolombia.com/img/logos/olimpica-stereo.webp' },
      { name: 'La Costeña Stereo', frequency: '91.0 FM', url: 'https://emisorasdecolombia.com/monteria/la-costena-stereo-910-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-costena-stereo-910-fm.webp' },
      { name: 'Unicórdoba Estéreo', frequency: '90.0 FM', url: 'https://emisorasdecolombia.com/monteria/unicordoba-estereo-900-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/unicordoba-estereo-900-fm.webp' },
    ],
  },
  neiva: {
    stations: [
      { name: 'Fiesta Stereo', frequency: '95.8 FM', url: 'https://emisorasdecolombia.com/neiva/fiesta-stereo-958-fm-la-plata-huila.html', logo: 'https://emisorasdecolombia.com/img/logos/fiesta-stereo-958-fm-la-plata-huila.webp' },
      { name: 'Global Estéreo', frequency: '96.8 FM', url: 'https://emisorasdecolombia.com/neiva/global-estereo-968-fm-la-plata-huila.html', logo: 'https://emisorasdecolombia.com/img/logos/global-estereo-968-fm-la-plata-huila.webp' },
      { name: 'Cristalina Estéreo Neiva', frequency: '101.3 FM', url: 'https://emisorasdecolombia.com/neiva/cristalina-estereo-neiva-1013-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/cristalina-estereo-neiva-1013-fm.webp' },
    ],
  },
  palmira: { stations: cali, nearbyOf: 'Cali' },
  pereira: {
    stations: [
      { name: 'La Mega Pereira', frequency: '105.2 FM', url: 'https://emisorasdecolombia.com/pereira/la-mega-pereira-1052-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-mega.webp' },
      { name: 'Bésame Pereira', frequency: '93.7 FM', url: 'https://emisorasdecolombia.com/pereira/besame-937-fm-pereira.html', logo: 'https://emisorasdecolombia.com/img/logos/besame-v2.webp' },
      { name: 'Radio Uno Pereira', frequency: '94.7 FM', url: 'https://emisorasdecolombia.com/pereira/radio-uno-pereira-947-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-uno.webp' },
    ],
  },
  'santa-marta': {
    stations: [
      { name: 'PaseitoRadio', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/santa-marta/paseitoradio.html' },
    ],
  },
  soledad: { stations: barranquilla, nearbyOf: 'Barranquilla' },
  valledupar: {
    stations: [
      { name: 'Maravilla Stereo', frequency: '105.7 FM', url: 'https://emisorasdecolombia.com/valledupar/maravilla-stereo-valledupar-1057-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/maravilla-stereo.webp' },
      { name: 'Alegría y Gozo', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/valledupar/alegria-y-gozo-radio-catolica.html', logo: 'https://emisorasdecolombia.com/img/logos/alegria-y-gozo-radio-catolica.webp' },
      { name: 'La Voz del Cañaguate', frequency: '860 AM', url: 'https://emisorasdecolombia.com/valledupar/la-voz-del-canaguate-860-am.html', logo: 'https://emisorasdecolombia.com/img/logos/la-voz-del-canaguate-860-am.webp' },
    ],
  },
  villavicencio: {
    stations: [
      { name: 'Radio Auténtica Villavicencio', frequency: '1080 AM', url: 'https://emisorasdecolombia.com/villavicencio/radio-autentica-villavicencio-1080-am.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-autentica.webp' },
    ],
  },
};

/** Devuelve la config de radio de una ciudad por su slug (`city.id`), o null. */
export function getCityRadio(cityId: string | undefined | null): CityRadio | null {
  if (!cityId) return null;
  return radioStationsByCity[cityId] ?? null;
}
