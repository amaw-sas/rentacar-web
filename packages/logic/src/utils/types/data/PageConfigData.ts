interface AvisoData {
  activo: boolean | number;
  imagen: string;
  url: string;
}

interface CarruselData {
  imagen: string;
  imagen_movil: string;
  imagen_url: string;
  alt: string;
  activo: boolean | number;
}

export default interface PageConfigData {
  boton_reserva: string;
  boton_masinfo: string;
  boton_masprecio: string;
  aviso?: AvisoData;
  carrusel?: CarruselData[];
  pagina_web?: string;
}
