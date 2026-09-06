/**
 * ============================================
 * ARYCAR - Configuração de API
 * ============================================
 *
 * Todas as configurações devem vir de variáveis de ambiente.
 * Consulte .env.example para referência.
 */

const env = import.meta.env;

export const apiConfig = {
  // ============================
  // BACKEND API
  // ============================
  API_BASE_URL: env.VITE_API_BASE_URL || '',

  // ============================
  // API DE PLACAS (placas.app.br)
  // ============================
  PLATE_API_URL: env.VITE_PLATE_API_URL || 'https://placas.app.br/api/v1/placas',
  PLATE_API_TOKEN: env.VITE_PLATE_API_TOKEN || '',

  // ============================
  // API FIPE (gratuita)
  // ============================
  FIPE_API_URL: env.VITE_FIPE_API_URL || 'https://parallelum.com.br/fipe/api/v1',

  // ============================
  // CONTATO PÚBLICO (Homepage)
  // Somente dígitos, com DDD. Ex.: 11999998888
  // ============================
  WHATSAPP_NUMBER: String(env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, ''),
};

/**
 * Verifica se o backend está configurado
 */
export const isBackendConfigured = () => !!apiConfig.API_BASE_URL;

/**
 * Verifica se a API de placas está configurada
 */
export const isPlateApiConfigured = () => !!apiConfig.PLATE_API_TOKEN;
