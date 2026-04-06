/**
 * Admin data configuration shared across all brands
 * Includes branches (for admin purposes) and vehicle categories
 */
import { branchesConfig } from './branches.config';

export interface AdminBranch {
  id: number;
  code: string;
  name: string;
  city: string;
  slug: string;
  schedule: Record<string, unknown>;
}

export interface VehicleModel {
  name: string;
  image: string;
  description: string;
  default: boolean;
}

export interface MonthPrice {
  "1k_kms": number;
  "2k_kms": number;
  "3k_kms": number;
  init_date: string;
  end_date: string;
  total_insurance_price: number;
  one_day_price: number;
}

export interface VehicleCategory {
  id: string;
  identification: string;
  name: string;
  category: string;
  description: string;
  image: string;
  ad: string;
  models: VehicleModel[];
  month_prices: MonthPrice[];
  total_coverage_unit_charge: number;
  active: number;
}

export interface AdminData {
  branches: AdminBranch[];
  categories: VehicleCategory[];
}


export const adminDataConfig: AdminData = {
  branches: branchesConfig.map(branch => ({
    ...branch,
    schedule: {}  // AdminBranch expects Record<string, unknown> for schedule
  })),
  categories: [
    {
      id: "C",
      identification: "C",
      name: "Gama C",
      category: "Gama C Económico Mecánico",
      description:
        "Automóvil de Trasmisión Mecánica de 5 pasajeros, 2 equipajes grandes 1 de mano, 5 puertas (HB), Aire AC, Rádio, VÍdrios Eléctricos, Dirección EPS, Frenos ABS, AirBags",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/renault-kwid-10-o-similar.webp",
      ad: "",
      models: [
        {
          name: "Fiat Mobi 1.0",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/fiat-mobi-10.webp",
          description: "o similar",
          default: true,
        },
        {
          name: "Renault Kwid 1.0",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/renault-kwid-10-o-similar.webp",
          description: "o similar",
          default: false,
        },
        {
          name: "Susuki S-Presso 1.0",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/susuki-s-presso-10.webp",
          description: "o similar",
          default: false,
        },
        {
          name: "Kia Picanto 1.0",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/chevrolet-spark-gt-12.webp",
          description: "o similar",
          default: false,
        },
      ],
      month_prices: [
        {
          "1k_kms": 3756000,
          "2k_kms": 4196000,
          "3k_kms": 4196000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 476000,
          one_day_price: 125200,
        },
      ],
      total_coverage_unit_charge: 67090,
      active: 1,
    },
    {
      id: "CX",
      identification: "CX",
      name: "Gama CX",
      category: "Gama CX Económico Automático",
      description:
        "Vehículo compacto con transmisión automática, ideal para desplazamientos urbanos con máxima comodidad. Equipado con dirección asistida eléctrica, aire acondicionado, vidrios eléctricos y un completo paquete de seguridad con 6 airbags y frenos ABS.",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/kia-picanto-zenith.webp",
      ad: "",
      models: [
        {
          name: "Kia Picanto Zenith 1.2 AT",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/kia-picanto-zenith.webp",
          description: "o similar",
          default: true,
        },
      ],
      month_prices: [
        {
          "1k_kms": 3445000,
          "2k_kms": 3849000,
          "3k_kms": 3849000,
          init_date: "15-01-2024",
          end_date: "30-12-2025",
          total_insurance_price: 476000,
          one_day_price: 220000,
        },
      ],
      total_coverage_unit_charge: 67000,
      active: 1,
    },
    {
      id: "F",
      identification: "F",
      name: "Gama F",
      category: "Gama F Sedán Mecánico",
      description:
        "Automóvil tipo Sedán y HatchBack, 5 pasajeros, 2 equipajes grandes y 2 de mano, Aire AC, Radio, Vídrios Eléctricos, Dirección EPS, Frenos ABS, AirBags",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/suzuki-swift-dzire-12.webp",
      ad: "",
      models: [
        {
          name: "Renault Sandero 1.6",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/renault-logan-16.webp",
          description: "HatchBack o similar",
          default: true,
        },
        {
          name: "Hyundai Accent 1.5",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/hyundai-accent-16.webp",
          description: "Sedán o similar",
          default: false,
        },
        {
          name: "Suzuki Baleno 1.4",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/suzuki-baleno-hb-13.webp",
          description: "HatchBack o similar",
          default: false,
        },
        {
          name: "Chevrolet Joy 1.4",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/chevrolet-joy-14-sedan.webp",
          description: "Sedán o similar",
          default: false,
        },
        {
          name: "Volkswagen Voyage 1.6",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/volkswagen-voyage-16-sedan.webp",
          description: "Sedán o similar",
          default: false,
        },
      ],
      month_prices: [
        {
          "1k_kms": 4467000,
          "2k_kms": 4909000,
          "3k_kms": 4909000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 476000,
          one_day_price: 148900,
        },
      ],
      total_coverage_unit_charge: 76366,
      active: 1,
    },
    {
      id: "FX",
      identification: "FX",
      name: "Gama FX",
      category: "Gama FX Sedán Automático",
      description:
        "5 personas +2 maletas grandes y 2 pequeñas +4 Puertas\n                Aire Acondicionado +Radio +Cierre central +Vidrios eléctrico\n                Dirección Asistida +Air Bag",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/hyundai-accent-advance-16.webp",
      ad: "",
      models: [
        {
          name: "Suzuki Swift Dzire 1.2",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/suzuki-swift-dzire-12.webp",
          description: "Sedán o similar",
          default: true,
        },
        {
          name: "Renault Logan 1.6",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/renault-logan-16.webp",
          description: "Sedán o similar",
          default: false,
        },
        {
          name: "Volkswagen Gol 1.6",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/volkswagen-gol-16.webp",
          description: "HatchBack o similar",
          default: false,
        },
        {
          name: "Kia Rio 1.3",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/kia-rio-13.webp",
          description: "HacthBack o similar",
          default: false,
        },
      ],
      month_prices: [
        {
          "1k_kms": 4614000,
          "2k_kms": 5056000,
          "3k_kms": 5056000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 476000,
          one_day_price: 153800,
        },
      ],
      total_coverage_unit_charge: 76366,
      active: 1,
    },
    {
      id: "LY",
      identification: "LY",
      name: "Gama LY",
      category: "Gama LY Sedán Automático Eléctrico",
      description:
        "Automóvil Electrico de 220km de Autonomia , 5 pasajeros, 2 equipajes grandes y 2 de mano, Aire AC, Radio, Vidrios electricos, Direccion EPS, Frenos ABS, AirBags",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/renault-zoe-o-similar.webp",
      ad: "",
      models: [
        {
          name: "Changan E-Star Electrico",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/e-star-electrico-automatico.webp",
          description: "HatchBack o similar",
          default: true,
        },
      ],
      month_prices: [
        {
          "1k_kms": 5788990,
          "2k_kms": 5788990,
          "3k_kms": 6579990,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 100,
          one_day_price: 0,
        },
      ],
      total_coverage_unit_charge: 100,
      active: 0,
    },
    {
      id: "G",
      identification: "G",
      name: "Gama G",
      category: "Gama G Camioneta Mecánica",
      description:
        "Camioneta de Transmisión Mecanica 4x2 a Gasolina, 5 pasageros, 5 Puertas, Aire AC, Radio, Cierre central, Vídrios Eléctricos, Dirección Asistida, Frenos ABS, Air Bags.",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/arona.webp",
      ad: "",
      models: [
        {
          name: "Fiat Pulse 1.3",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/fiat-pulse-13.webp",
          description: "o similar",
          default: true,
        },
        {
          name: "Hyundai Creta",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/hyundai-creta.webp",
          description: "o similar",
          default: false,
        },
        {
          name: "Seat Arona",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/seat-arona.webp",
          description: "o similar",
          default: false,
        },
        {
          name: "Suzuki Vitara 1.4",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/suzuki-vitara-1.webp",
          description: "o similar",
          default: false,
        },
      ],
      month_prices: [
        {
          "1k_kms": 0,
          "2k_kms": 6584990,
          "3k_kms": 6584990,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 100,
          one_day_price: 0,
        },
      ],
      total_coverage_unit_charge: 100,
      active: 0,
    },
    {
      id: "GC",
      identification: "GC",
      name: "Gama GC",
      category: "Gama GC Camioneta Automática",
      description:
        "5 personas +2 maletas grandes y 3 pequeñas +4 Puertas\n                Aire Acondicionado +Radio +Cierre central +Vidrios eléctrico\n                Dirección Asistida +Air Bag",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/seat-arona-16.webp",
      ad: "",
      models: [
        {
          name: "Hyundai Creta 1.6",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/hyundai-creta-16.webp",
          description: "o similar",
          default: true,
        },
        {
          name: "Opel Crossland",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/opel-crossland.webp",
          description: "o similar",
          default: false,
        },
        {
          name: "Kia Sonet",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/kia-sonet.webp",
          description: "o similar",
          default: false,
        },
      ],
      month_prices: [
        {
          "1k_kms": 5938000,
          "2k_kms": 6582000,
          "3k_kms": 6582000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 595000,
          one_day_price: 197900,
        },
      ],
      total_coverage_unit_charge: 98741,
      active: 0,
    },
    {
      id: "G4",
      identification: "G4",
      name: "Gama G4",
      category: "Gama G4 Camioneta Mecánica 4X4",
      description:
        "5 personas +2 maletas grandes y 3 pequeñas +4 Puertas\n                Aire Acondicionado +Radio +Cierre central +Vidrios eléctrico\n                Dirección Asistida +Air Bag",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/renault-duster-dynamiqe-20.webp",
      ad: "",
      models: [
        {
          name: "Renault Duster Iconic 4x2",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/renault-duster-dynamiqe-20.webp",
          description: "o similar",
          default: true,
        },
      ],
      month_prices: [
        {
          "1k_kms": 6458000,
          "2k_kms": 7102000,
          "3k_kms": 7102000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 595000,
          one_day_price: 214266,
        },
      ],
      total_coverage_unit_charge: 98741,
      active: 1,
    },
    {
      id: "LP",
      identification: "LP",
      name: "Gama LP",
      category: "Gama LP Sedán Automático Híbrido",
      description:
        "5 personas +2 maletas grandes y 2 pequeñas +4 Puertas\n                Aire Acondicionado +Radio +Cierre central +Vidrios eléctrico\n                Dirección Asistida +Air Bag",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/toyota-corolla-hibrido.webp",
      ad: "",
      models: [
        {
          name: "Toyota Corolla Híbrido",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/toyota-corolla-hibrido.webp",
          description: "o similar",
          default: true,
        },
      ],
      month_prices: [
        {
          "1k_kms": 0,
          "2k_kms": 8288990,
          "3k_kms": 8288990,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 100,
          one_day_price: 0,
        },
      ],
      total_coverage_unit_charge: 100,
      active: 0,
    },
    {
      id: "VP",
      identification: "VP",
      name: "Gama VP",
      category: "Gama VP Camioneta Mecánica de Platón",
      description:
        "Camioneta 4x4 de Transmisión Mecanica, Doble Cabina, 650kg de Carga, 1.3L Turbo a Gasolina, Potencia 154HP, 5 pasageros, 4 Puertas, Aire AC, Radio, Cierre central, Vídrios Eléctricos, Dirección Asistida, Frenos ABS, Air Bags.",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/renault-duster-oroch-4x4.webp",
      ad: "",
      models: [
        {
          name: "Renault Duster Oroch 4x4",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/prueva-1.webp",
          description: "o similar",
          default: true,
        },
      ],
      month_prices: [
        {
          "1k_kms": 6458000,
          "2k_kms": 6899000,
          "3k_kms": 6899000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 595000,
          one_day_price: 550000,
        },
      ],
      total_coverage_unit_charge: 102011,
      active: 1,
    },
    {
      id: "GX",
      identification: "GX",
      name: "Gama GX",
      category: "Gama GX Camioneta Automática 4x2",
      description:
        "Camioneta de Transmisión Automatica 4x2 a Gasolina, 5 pasageros, 5 Puertas, Aire AC, Radio, Cierre central, Vídrios Eléctricos, Dirección Asistida, Frenos ABS, Air Bags.",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/susuki-vitara-15.webp",
      ad: "",
      models: [
        {
          name: "Susuki Vitara 1.5",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/susuki-vitara-15.webp",
          description: "o similar",
          default: true,
        },
      ],
      month_prices: [
        {
          "1k_kms": 0,
          "2k_kms": 7961990,
          "3k_kms": 7961990,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 100,
          one_day_price: 0,
        },
      ],
      total_coverage_unit_charge: 100,
      active: 0,
    },
    {
      id: "LE",
      identification: "LE",
      name: "Gama LE",
      category: "Gama LE Camioneta Automática Especial",
      description:
        "Modelos 2022 2023 2024 ++ 5 personas +2 maletas grandes y 3 pequeñas +4 Puertas\n                Aire Acondicionado +Radio +Cierre central +Vidrios eléctrico\n                Dirección Asistida +Air Bag",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/renault-koleos-25.webp",
      ad: "",
      models: [
        {
          name: "Renault Koleos 2.5",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/renault-koleos-25.webp",
          description: "o similar",
          default: true,
        },
        {
          name: "Nissan Qashqai 2.0",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/nissan-qashqai-20.webp",
          description: "o similar",
          default: false,
        },
        {
          name: "Mitsubishi Outlander 2.4",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/mitsubishi-outlander-24.webp",
          description: "o similar",
          default: false,
        },
      ],
      month_prices: [
        {
          "1k_kms": 6978000,
          "2k_kms": 8324000,
          "3k_kms": 8324000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 595000,
          one_day_price: 232600,
        },
      ],
      total_coverage_unit_charge: 102011,
      active: 1,
    },
    {
      id: "GY",
      identification: "GY",
      name: "Gama GY",
      category: "Gama GY SUV Automática 7 puestos",
      description:
        "SUV espaciosa con transmisión automática y capacidad para 7 pasajeros. Motor 1.6 turbo, dirección asistida eléctrica, aire acondicionado, vidrios eléctricos y 7 airbags. Frenos ABS.",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/hyundai-santa-fe-16.webp",
      ad: "",
      models: [
        {
          name: "Hyundai Santa Fe 1.6 AT",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/hyundai-santa-fe-16.webp",
          description: "o similar",
          default: true,
        },
      ],
      month_prices: [
        {
          "1k_kms": 10641000,
          "2k_kms": 11987000,
          "3k_kms": 11987000,
          init_date: "15-01-2024",
          end_date: "30-12-2025",
          total_insurance_price: 595000,
          one_day_price: 550000,
        },
      ],
      total_coverage_unit_charge: 102011,
      active: 1,
    },
    {
      id: "GR",
      identification: "GR",
      name: "Gama GR",
      category: "Gama GR Camioneta Automática 7 puestos",
      description:
        "7 Puestos  + 2 maletas grandes y 3 pequeñas +4 Puertas\n\n                Dirección Asistida +Air Bag",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/mitsubishi-montero-sport-30.webp",
      ad: "",
      models: [
        {
          name: "Mitsubishi Montero Sport 3.0",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/mitsubishi-montero-sport-30.webp",
          description: "o similar",
          default: true,
        },
        {
          name: "Chevrolet Trailblazer 2.8",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/chevrolet-trailblazer-28.webp",
          description: "o similar",
          default: false,
        },
      ],
      month_prices: [
        {
          "1k_kms": 10641000,
          "2k_kms": 11987000,
          "3k_kms": 11987000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 595000,
          one_day_price: 550000,
        },
      ],
      total_coverage_unit_charge: 102011,
      active: 0,
    },
    {
      id: "FL",
      identification: "FL",
      name: "Gama FL",
      category: "Gama FL Compacto Mecánico Híbrido",
      description:
        "5 Puestos +4 Puertas\n                Aire Acondicionado +Radio +Cierre central +Vidrios eléctrico\n                Dirección Asistida +Air Bag +Sin pico y placa",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/gama-fl-compacto-mecanico-hibirdo.webp",
      ad: "",
      models: [
        {
          name: "Suzuki Swift Híbrido",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/gama-fl-compacto-mecanico-hibirdo.webp",
          description: "o similar",
          default: true,
        },
      ],
      month_prices: [
        {
          "1k_kms": 5610000,
          "2k_kms": 6051000,
          "3k_kms": 6051000,
          init_date: "15-01-2024",
          end_date: "30-12-2024",
          total_insurance_price: 476000,
          one_day_price: 290000,
        },
      ],
      total_coverage_unit_charge: 76366,
      active: 0,
    },
    {
      id: "FU",
      identification: "FU",
      name: "Gama FU",
      category: "Gama FU Sedán Automático",
      description:
        "5 personas +2 maletas grandes y 2 pequeñas +4 Puertas\n                Aire Acondicionado +Radio +Cierre central +Vidrios eléctrico\n                Dirección Asistida +Air Bag +Sin pico y placa",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/hyundai-accent-advance-16.webp",
      ad: "",
      models: [
        {
          name: "Suzuki Baleno 1.4",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/suzuki-baleno-hb-13.webp",
          description: "HatchBack o similar",
          default: true,
        },
        {
          name: "Hyundai Accent Advanced 1.6",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/hyundai-accent-advance-16.webp",
          description: "Sedán o similar",
          default: false,
        },
        {
          name: "Suzuki Swift Dzire 1.2",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/suzuki-swift-dzire-12.webp",
          description: "Sedán o similar",
          default: false,
        },
      ],
      month_prices: [],
      total_coverage_unit_charge: 76366,
      active: 0,
    },
    {
      id: "GL",
      identification: "GL",
      name: "Gama GL",
      category: "Gama GL Camioneta Automática",
      description:
        "5 Puestos +4 Puertas\n                Aire Acondicionado +Radio +Cierre central +Vidrios eléctrico\n                Dirección Asistida +Air Bag +Sin pico y placa",
      image:
        "https://storage.googleapis.com/aw-rentcar/carcategories/gama-gl-camioneta-automatica.webp",
      ad: "",
      models: [
        {
          name: "Renault Duster 1.3",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/gama-gl-camioneta-automatica.webp",
          description: "o similar",
          default: true,
        },
        {
          name: "Fiat Pulse Turbo 1.3",
          image:
            "https://storage.googleapis.com/aw-rentcar/carcategories/fiat-pulse-13.webp",
          description: "o similar",
          default: false,
        },
      ],
      month_prices: [],
      total_coverage_unit_charge: 98741,
      active: 0,
    },
  ],
};
