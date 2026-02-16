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
  // CONFIGURAÇÕES DO BANCO (referência para backend)
  // ============================
  dbConfig: {
    user: env.POSTGRES_USER || 'arycar_user',
    host: env.POSTGRES_HOST || 'postgres',
    database: env.POSTGRES_DB || 'arycar_db',
    password: env.POSTGRES_PASSWORD || 'arycar_pass_123',
    port: Number(env.POSTGRES_PORT || 5432),
  },
};

/**
 * Verifica se o backend está configurado
 */
export const isBackendConfigured = () => !!apiConfig.API_BASE_URL;

/**
 * Verifica se a API de placas está configurada
 */
export const isPlateApiConfigured = () => !!apiConfig.PLATE_API_TOKEN;
