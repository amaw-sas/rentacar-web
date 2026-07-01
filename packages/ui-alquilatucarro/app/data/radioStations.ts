/**
 * Emisoras de radio por ciudad para la sección "Emisoras más escuchadas" de las
 * páginas de ciudad (solo alquilatucarro). Datos fijos, curados desde
 * emisorasdecolombia.com. Keyed por `city.id` (el slug).
 *
 * Cada ciudad define además su propio contenido de la sección — `title` (H2
 * creativo, sin repetir "radio {ciudad} en vivo"), `intro` (copy partido
 * alrededor del enlace con keyword) y `linkSlug`/`linkAnchor` (enlace seguible
 * a la página de ciudad de la fuente). Los textos varían entre ciudades a
 * propósito: copiar la misma frase en masa se ve artificial y no aporta SEO.
 *
 * Floridablanca / Palmira / Soledad no tienen emisoras ni página propia en la
 * fuente: usan las de su ciudad vecina (Bucaramanga / Cali / Barranquilla).
 * `nearbyOf` deja constancia y `linkSlug` apunta a la vecina (la única página
 * que resuelve 200 en el origen).
 *
 * `logo` es opcional: cuando falta, la tarjeta muestra un círculo con la
 * inicial. La imagen carga lazy y, si el host falla, cae al mismo fallback.
 */
export interface RadioStation {
  name: string;
  /** "89.4 FM" / "1040 AM" / "En vivo" (online sin dial fijo) */
  frequency: string;
  /** Página de la emisora; abre en pestaña nueva. Sin `.html` (ver getCityRadio) */
  url: string;
  /** Logo absoluto; ausente → fallback con la inicial */
  logo?: string;
}

export interface CityRadio {
  stations: RadioStation[];
  /** Nombre de la ciudad vecina cuyas emisoras se reutilizan (si aplica) */
  nearbyOf?: string;
  /** H2 creativo de la sección; evita repetir "radio {ciudad} en vivo" */
  title: string;
  /** Copy de intro partido en dos: antes y después del enlace con keyword */
  intro: { before: string; after: string };
  /** Slug de la página de ciudad en emisorasdecolombia.com para el enlace */
  linkSlug: string;
  /** Anchor con keywords del enlace a la página de ciudad */
  linkAnchor: string;
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
  armenia: {
    stations: armenia,
    title: 'Música de altura para rodar por el Quindío',
    intro: { before: 'Pon a sonar ', after: ' y deja que el Eje Cafetero te acompañe kilómetro a kilómetro.' },
    linkSlug: 'armenia',
    linkAnchor: 'las emisoras de Armenia en vivo por internet',
  },
  barranquilla: {
    stations: barranquilla,
    title: 'El sabor costeño que anima cada kilómetro',
    intro: { before: 'Sintoniza ', after: ' y llévate la alegría del Caribe en cada trayecto.' },
    linkSlug: 'barranquilla',
    linkAnchor: 'las emisoras de Barranquilla en vivo online',
  },
  bogota: {
    stations: [
      { name: 'Blu Radio Bogotá', frequency: '89.9 FM', url: 'https://emisorasdecolombia.com/bogota/blu-radio-bogota-899-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/blu-radio.webp' },
      { name: 'Caracol Radio Bogotá', frequency: '100.9 FM', url: 'https://emisorasdecolombia.com/bogota/caracol-radio-bogota-1009-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/caracol-radio.webp' },
      { name: 'La Kalle Bogotá', frequency: '96.9 FM', url: 'https://emisorasdecolombia.com/bogota/la-kalle-bogota-969-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-kalle.webp' },
    ],
    title: 'La banda sonora de tus trayectos por la capital',
    intro: { before: 'Escucha ', after: ' y haz más llevadero el tráfico mientras recorres la ciudad.' },
    linkSlug: 'bogota',
    linkAnchor: 'las emisoras de Bogotá en vivo por internet',
  },
  bucaramanga: {
    stations: bucaramanga,
    title: 'Buen sonido para moverte por la Ciudad Bonita',
    intro: { before: 'Conecta ', after: ' y que la música te acompañe por las calles de Santander.' },
    linkSlug: 'bucaramanga',
    linkAnchor: 'las emisoras de Bucaramanga en vivo online',
  },
  cali: {
    stations: cali,
    title: 'Salsa y ritmo para tus recorridos por Cali',
    intro: { before: 'Dale play a ', after: ' y baila con el volante mientras conoces la Sucursal del Cielo.' },
    linkSlug: 'cali',
    linkAnchor: 'las emisoras de Cali en vivo por internet',
  },
  cartagena: {
    stations: [
      { name: 'Radio Tiempo Cartagena', frequency: '88.5 FM', url: 'https://emisorasdecolombia.com/cartagena/radio-tiempo-cartagena-colombia.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-tiempo.webp' },
      { name: 'Olímpica Stereo Cartagena', frequency: '90.5 FM', url: 'https://emisorasdecolombia.com/cartagena/olimpica-stereo-905-fm-cartagena.html', logo: 'https://emisorasdecolombia.com/img/logos/olimpica-stereo.webp' },
      { name: 'La Reina Cartagena', frequency: '95.5 FM', url: 'https://emisorasdecolombia.com/cartagena/la-reina-cartagena-955-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-reina.webp' },
    ],
    title: 'Ritmo caribeño mientras recorres la Heroica',
    intro: { before: 'Sintoniza ', after: ' y ponle sabor a cada paseo por la ciudad amurallada.' },
    linkSlug: 'cartagena',
    linkAnchor: 'las emisoras de Cartagena en vivo online',
  },
  cucuta: {
    stations: [
      { name: 'Bésame Cúcuta', frequency: '100.7 FM', url: 'https://emisorasdecolombia.com/cucuta/besame-1007-fm-cucuta.html', logo: 'https://emisorasdecolombia.com/img/logos/besame-v2.webp' },
      { name: 'La Voz del Norte', frequency: '1040 AM', url: 'https://emisorasdecolombia.com/cucuta/la-voz-del-norte-1040-am.html', logo: 'https://emisorasdecolombia.com/img/logos/la-voz-del-norte-1040-am.webp' },
    ],
    title: 'Compañía sonora para tus rutas por la frontera',
    intro: { before: 'Escucha ', after: ' y viaja con buena música por Norte de Santander.' },
    linkSlug: 'cucuta',
    linkAnchor: 'las emisoras de Cúcuta en vivo por internet',
  },
  floridablanca: {
    stations: bucaramanga,
    nearbyOf: 'Bucaramanga',
    title: 'Buen sonido en el área metropolitana de Bucaramanga',
    intro: { before: 'Desde Floridablanca, sintoniza ', after: ' y muévete por el área metropolitana con la mejor compañía.' },
    linkSlug: 'bucaramanga',
    linkAnchor: 'las emisoras de Bucaramanga en vivo online',
  },
  ibague: {
    stations: [
      { name: 'Ecos del Combeima', frequency: '790 AM', url: 'https://emisorasdecolombia.com/ibague/ecos-del-combeima-hjnc-790-khz-am-ibague-tolima.html', logo: 'https://emisorasdecolombia.com/img/logos/ecos-del-combeima-hjnc-790-khz-am-ibague-tolima.webp' },
      { name: 'Radio Cristiano Bíblico', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/ibague/radio-cristiano-biblico.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-cristiano-biblico.webp' },
      { name: 'Ondas de Ibagué', frequency: '1470 AM', url: 'https://emisorasdecolombia.com/ibague/ondas-de-ibague-1470-am.html', logo: 'https://emisorasdecolombia.com/img/logos/ondas-de-ibague-1470-am.webp' },
    ],
    title: 'En la capital musical, tu viaje también suena',
    intro: { before: 'Pon ', after: ' y comprueba por qué Ibagué lleva la música en el nombre.' },
    linkSlug: 'ibague',
    linkAnchor: 'las emisoras de Ibagué en vivo online',
  },
  manizales: {
    stations: [
      { name: 'Colombia Salsa Dura', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/manizales/colombia-salsa-dura.html' },
      { name: 'Colombia Crossover', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/manizales/colombia-crossover.html' },
      { name: 'Colombia Urbana', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/manizales/colombia-urbana.html' },
    ],
    title: 'Sonido paisa entre montañas y café',
    intro: { before: 'Enciende ', after: ' y sube por la cordillera con la mejor compañía.' },
    linkSlug: 'manizales',
    linkAnchor: 'las emisoras de Manizales en vivo por internet',
  },
  medellin: {
    stations: [
      { name: 'Olímpica Stereo Medellín', frequency: '104.9 FM', url: 'https://emisorasdecolombia.com/medellin/olimpica-stereo-medellin-1049-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/olimpica-stereo.webp' },
      { name: 'La Mega Medellín', frequency: '92.9 FM', url: 'https://emisorasdecolombia.com/medellin/la-mega-medellin-929-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-mega.webp' },
      { name: 'Bésame Medellín', frequency: '94.9 FM', url: 'https://emisorasdecolombia.com/medellin/besame-medellin-949-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/besame-v2.webp' },
    ],
    title: 'Ponle ritmo paisa a cada trayecto',
    intro: { before: 'Escucha ', after: ' y recorre la ciudad de la eterna primavera al son de tu música.' },
    linkSlug: 'medellin',
    linkAnchor: 'las emisoras de Medellín en vivo online',
  },
  monteria: {
    stations: [
      { name: 'Olímpica Stereo Montería', frequency: '90.5 FM', url: 'https://emisorasdecolombia.com/monteria/olimpica-stereo-905-fm-monteria.html', logo: 'https://emisorasdecolombia.com/img/logos/olimpica-stereo.webp' },
      { name: 'La Costeña Stereo', frequency: '91.0 FM', url: 'https://emisorasdecolombia.com/monteria/la-costena-stereo-910-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-costena-stereo-910-fm.webp' },
      { name: 'Unicórdoba Estéreo', frequency: '90.0 FM', url: 'https://emisorasdecolombia.com/monteria/unicordoba-estereo-900-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/unicordoba-estereo-900-fm.webp' },
    ],
    title: 'El aire del Sinú acompaña tu recorrido',
    intro: { before: 'Sintoniza ', after: ' y rueda por la capital ganadera con buen ambiente.' },
    linkSlug: 'monteria',
    linkAnchor: 'las emisoras de Montería en vivo por internet',
  },
  neiva: {
    stations: [
      { name: 'Fiesta Stereo', frequency: '95.8 FM', url: 'https://emisorasdecolombia.com/neiva/fiesta-stereo-958-fm-la-plata-huila.html', logo: 'https://emisorasdecolombia.com/img/logos/fiesta-stereo-958-fm-la-plata-huila.webp' },
      { name: 'Global Estéreo', frequency: '96.8 FM', url: 'https://emisorasdecolombia.com/neiva/global-estereo-968-fm-la-plata-huila.html', logo: 'https://emisorasdecolombia.com/img/logos/global-estereo-968-fm-la-plata-huila.webp' },
      { name: 'Cristalina Estéreo Neiva', frequency: '101.3 FM', url: 'https://emisorasdecolombia.com/neiva/cristalina-estereo-neiva-1013-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/cristalina-estereo-neiva-1013-fm.webp' },
    ],
    title: 'Del Huila para tu carretera, sin cortes',
    intro: { before: 'Pon a sonar ', after: ' y que el bambuco te acompañe por las rutas del sur.' },
    linkSlug: 'neiva',
    linkAnchor: 'las emisoras de Neiva en vivo online',
  },
  palmira: {
    stations: cali,
    nearbyOf: 'Cali',
    title: 'Ritmo vallecaucano muy cerca de Palmira',
    intro: { before: 'A pocos minutos de Cali, pon ', after: ' y llévate la salsa del Valle en cada trayecto.' },
    linkSlug: 'cali',
    linkAnchor: 'las emisoras de Cali en vivo por internet',
  },
  pereira: {
    stations: [
      { name: 'La Mega Pereira', frequency: '105.2 FM', url: 'https://emisorasdecolombia.com/pereira/la-mega-pereira-1052-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/la-mega.webp' },
      { name: 'Bésame Pereira', frequency: '93.7 FM', url: 'https://emisorasdecolombia.com/pereira/besame-937-fm-pereira.html', logo: 'https://emisorasdecolombia.com/img/logos/besame-v2.webp' },
      { name: 'Radio Uno Pereira', frequency: '94.7 FM', url: 'https://emisorasdecolombia.com/pereira/radio-uno-pereira-947-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-uno.webp' },
    ],
    title: 'Buena música para rodar por la Perla del Otún',
    intro: { before: 'Conecta ', after: ' y disfruta el ambiente cafetero mientras manejas.' },
    linkSlug: 'pereira',
    linkAnchor: 'las emisoras de Pereira en vivo por internet',
  },
  'santa-marta': {
    stations: [
      { name: 'PaseitoRadio', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/santa-marta/paseitoradio.html' },
    ],
    title: 'El sonido del Caribe para tu carretera',
    intro: { before: 'Escucha ', after: ' directamente desde tu carro y deja que la brisa marina marque el ritmo.' },
    linkSlug: 'santa-marta',
    linkAnchor: 'las emisoras de Santa Marta en vivo online',
  },
  soledad: {
    stations: barranquilla,
    nearbyOf: 'Barranquilla',
    title: 'El sabor costeño del área de Barranquilla',
    intro: { before: 'Desde Soledad, escucha ', after: ' y recorre el área metropolitana con toda la alegría del Caribe.' },
    linkSlug: 'barranquilla',
    linkAnchor: 'las emisoras de Barranquilla en vivo online',
  },
  valledupar: {
    stations: [
      { name: 'Maravilla Stereo', frequency: '105.7 FM', url: 'https://emisorasdecolombia.com/valledupar/maravilla-stereo-valledupar-1057-fm.html', logo: 'https://emisorasdecolombia.com/img/logos/maravilla-stereo.webp' },
      { name: 'Alegría y Gozo', frequency: 'En vivo', url: 'https://emisorasdecolombia.com/valledupar/alegria-y-gozo-radio-catolica.html', logo: 'https://emisorasdecolombia.com/img/logos/alegria-y-gozo-radio-catolica.webp' },
      { name: 'La Voz del Cañaguate', frequency: '860 AM', url: 'https://emisorasdecolombia.com/valledupar/la-voz-del-canaguate-860-am.html', logo: 'https://emisorasdecolombia.com/img/logos/la-voz-del-canaguate-860-am.webp' },
    ],
    title: 'Vallenato en vivo para tus kilómetros por el Cesar',
    intro: { before: 'Sintoniza ', after: ' y viaja al compás del acordeón por la tierra del vallenato.' },
    linkSlug: 'valledupar',
    linkAnchor: 'las emisoras de Valledupar en vivo por internet',
  },
  villavicencio: {
    stations: [
      { name: 'Radio Auténtica Villavicencio', frequency: '1080 AM', url: 'https://emisorasdecolombia.com/villavicencio/radio-autentica-villavicencio-1080-am.html', logo: 'https://emisorasdecolombia.com/img/logos/radio-autentica.webp' },
    ],
    title: 'Joropo y llano abierto para tu viaje',
    intro: { before: 'Pon ', after: ' y siente el aire llanero mientras recorres el Meta.' },
    linkSlug: 'villavicencio',
    linkAnchor: 'las emisoras de Villavicencio en vivo online',
  },
};

/**
 * Devuelve la config de radio de una ciudad por su slug (`city.id`), o null.
 * Normaliza las URLs de emisora quitando el `.html` final: la fuente resuelve
 * la versión limpia con 200 y conserva mejor el valor de enlace saliente.
 */
export function getCityRadio(cityId: string | undefined | null): CityRadio | null {
  if (!cityId) return null;
  const raw = radioStationsByCity[cityId];
  if (!raw) return null;
  return {
    ...raw,
    stations: raw.stations.map((s) => ({ ...s, url: s.url.replace(/\.html$/, '') })),
  };
}
