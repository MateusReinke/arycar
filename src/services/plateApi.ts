import { apiConfig, isPlateApiConfigured } from '@/config/api';
import { VehicleSize, VehicleType } from '@/types';

export interface PlateApiResponse {
  numero: string;
  marca: string;
  modelo: string;
  ano_fabricacao: string;
  ano_modelo: string;
  cor: string;
  sub_segmento: string;
  segmento: string;
  tipo_veiculo: string;
  // ... other fields
}

/**
 * Traduz o sub_segmento da API para o porte do veículo
 */
export const translateSubSegmentToSize = (subSegmento: string): VehicleSize => {
  const upper = (subSegmento || '').toUpperCase();
  if (upper.includes('SUV') || upper.includes('PICKUP') || upper.includes('UTILITARIO') || upper.includes('UTILITÁRIO')) {
    return 'G';
  }
  if (upper.includes('SEDAN') || upper.includes('HATCH') || upper.includes('COMPACTO')) {
    return 'M';
  }
  if (upper.includes('MOTO') || upper.includes('CICLOMOTOR') || upper.includes('TRICICLO')) {
    return 'P';
  }
  return 'M'; // Default
};

/**
 * Traduz o tipo_veiculo da API para o tipo interno
 */
export const translateVehicleType = (tipoVeiculo: string, segmento: string): VehicleType => {
  const upper = (tipoVeiculo || segmento || '').toUpperCase();
  if (upper.includes('MOTO') || upper.includes('CICLOMOTOR')) return 'moto';
  if (upper.includes('CAMINHÃO') || upper.includes('CAMINHAO') || upper.includes('ONIBUS') || upper.includes('ÔNIBUS')) return 'caminhao';
  return 'carro';
};

/**
 * Consulta dados do veículo pela placa
 */
export const lookupPlate = async (plate: string): Promise<PlateApiResponse | null> => {
  if (!isPlateApiConfigured()) {
    console.warn('API de placas não configurada. Defina PLATE_API_TOKEN em src/config/api.ts');
    return null;
  }

  try {
    const response = await fetch(`${apiConfig.PLATE_API_URL}/${plate}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.PLATE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Plate API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao consultar placa:', error);
    return null;
  }
};
