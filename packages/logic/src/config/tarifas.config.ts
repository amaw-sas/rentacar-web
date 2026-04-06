/**
 * Monthly rental rates configuration (Persona Natural)
 * Updated manually when the rental company sends new rate tables
 */

export interface TarifaPlan {
  daily: number;
  monthly: number;
}

export interface TarifaGama {
  code: string;
  name: string;
  kmExtra: number;
  plan1k: TarifaPlan;
  plan2k: TarifaPlan;
}

export interface TarifasConfig {
  period: {
    start: string;
    end: string;
    label: string;
  };
  gamas: TarifaGama[];
}

export const tarifasConfig: TarifasConfig = {
  period: {
    start: '2026-02-01',
    end: '2026-03-31',
    label: '1 Feb – 31 Mar 2026',
  },
  gamas: [
    {
      code: 'C',
      name: 'Económico',
      kmExtra: 700,
      plan1k: { daily: 114833, monthly: 3445000 },
      plan2k: { daily: 128300, monthly: 3849000 },
    },
    {
      code: 'F',
      name: 'Sedán Mecánico',
      kmExtra: 700,
      plan1k: { daily: 136600, monthly: 4098000 },
      plan2k: { daily: 150100, monthly: 4503000 },
    },
    {
      code: 'FX',
      name: 'Sedán Automático',
      kmExtra: 700,
      plan1k: { daily: 141100, monthly: 4233000 },
      plan2k: { daily: 154600, monthly: 4638000 },
    },
    {
      code: 'FL',
      name: 'Compacto Híbrido',
      kmExtra: 700,
      plan1k: { daily: 171533, monthly: 5146000 },
      plan2k: { daily: 185033, monthly: 5551000 },
    },
    {
      code: 'FU',
      name: 'Sedán Full',
      kmExtra: 700,
      plan1k: { daily: 181200, monthly: 5436000 },
      plan2k: { daily: 194700, monthly: 5841000 },
    },
    {
      code: 'GC',
      name: 'Camioneta',
      kmExtra: 900,
      plan1k: { daily: 181567, monthly: 5447000 },
      plan2k: { daily: 201267, monthly: 6038000 },
    },
    {
      code: 'G4',
      name: 'Camioneta 4x4',
      kmExtra: 900,
      plan1k: { daily: 197467, monthly: 5924000 },
      plan2k: { daily: 217167, monthly: 6515000 },
    },
    {
      code: 'GL',
      name: 'Camioneta Full',
      kmExtra: 900,
      plan1k: { daily: 208533, monthly: 6256000 },
      plan2k: { daily: 228233, monthly: 6847000 },
    },
    {
      code: 'LE',
      name: 'Camioneta Especial',
      kmExtra: 1100,
      plan1k: { daily: 213367, monthly: 6401000 },
      plan2k: { daily: 254533, monthly: 7636000 },
    },
    {
      code: 'LU',
      name: 'Camioneta Lujo',
      kmExtra: 1100,
      plan1k: { daily: 228367, monthly: 6851000 },
      plan2k: { daily: 269533, monthly: 8086000 },
    },
    {
      code: 'GR',
      name: 'Camioneta 7 Puestos',
      kmExtra: 1100,
      plan1k: { daily: 325400, monthly: 9762000 },
      plan2k: { daily: 366567, monthly: 10997000 },
    },
    {
      code: 'GY',
      name: 'Premium',
      kmExtra: 1100,
      plan1k: { daily: 466833, monthly: 14005000 },
      plan2k: { daily: 508000, monthly: 15240000 },
    },
  ],
};
