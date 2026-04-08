export interface VehicleCategoryModel {
    nombre: string;
    image: string;
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
