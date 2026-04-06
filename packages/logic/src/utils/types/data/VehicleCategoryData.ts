export interface VehicleCategoryImage {
    avif: string;
    webp: string;
    jpg: string;
  }
  
export interface VehicleCategoryModel {
    nombre: string;
    imagenes: VehicleCategoryImage;
}

export interface VehicleCategory {
    grupo: string,
    modelos: VehicleCategoryModel[];
    descripcion_corta: string;
    descripcion_larga: string;
    tags: string[];
}

export default interface VehicleCategoryData {
    [key: string]: VehicleCategory;
}
  