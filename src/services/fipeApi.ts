import { apiConfig } from '@/config/api';

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: number;
  nome: string;
}

export interface FipeModelsResponse {
  modelos: FipeModel[];
  anos: { codigo: string; nome: string }[];
}

type FipeVehicleType = 'carros' | 'motos' | 'caminhoes';

const vehicleTypeToFipe: Record<string, FipeVehicleType> = {
  carro: 'carros',
  moto: 'motos',
  caminhao: 'caminhoes',
};

/**
 * Busca marcas da FIPE por tipo de veículo
 */
export const fetchFipeBrands = async (vehicleType: string): Promise<FipeBrand[]> => {
  const fipeType = vehicleTypeToFipe[vehicleType] || 'carros';
  try {
    const response = await fetch(`${apiConfig.FIPE_API_URL}/${fipeType}/marcas`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar marcas FIPE:', error);
    return [];
  }
};

/**
 * Busca modelos da FIPE por marca
 */
export const fetchFipeModels = async (vehicleType: string, brandCode: string): Promise<FipeModel[]> => {
  const fipeType = vehicleTypeToFipe[vehicleType] || 'carros';
  try {
    const response = await fetch(`${apiConfig.FIPE_API_URL}/${fipeType}/marcas/${brandCode}/modelos`);
    if (!response.ok) return [];
    const data: FipeModelsResponse = await response.json();
    return data.modelos || [];
  } catch (error) {
    console.error('Erro ao buscar modelos FIPE:', error);
    return [];
  }
};
