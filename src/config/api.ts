/**
 * ============================================
 * ARYCAR - Configuração de API
 * ============================================
 * 
 * Este arquivo centraliza todas as configurações de conexão.
 * Quando você tiver seu backend Docker rodando, basta alterar
 * o BASE_URL para apontar para sua API.
 * 
 * Exemplo com Docker local:
 *   API_BASE_URL: 'http://localhost:3001/api'
 * 
 * Exemplo com servidor remoto:
 *   API_BASE_URL: 'https://api.arycar.com.br/api'
 * 
 * O backend deve implementar os endpoints documentados em
 * docs/DATABASE_SCHEMA.md
 */

export const apiConfig = {
  // ============================
  // BACKEND API (seu Docker)
  // ============================
  // Altere para a URL da sua API quando estiver pronta
  API_BASE_URL: '',  // Vazio = usa localStorage como fallback

  // ============================
  // API DE PLACAS (placas.app.br)
  // ============================
  PLATE_API_URL: 'https://placas.app.br/api/v1/placas',
  PLATE_API_TOKEN: '', // Coloque sua API Key aqui

  // ============================
  // API FIPE (gratuita)
  // ============================
  FIPE_API_URL: 'https://parallelum.com.br/fipe/api/v1',

  // ============================
  // CONFIGURAÇÕES DO BANCO (referência para seu Docker)
  // ============================
  // Use esta referência para configurar seu backend:
  dbConfig: {
    user: 'seu_usuario_postgre',
    host: 'localhost',
    database: 'arycar_db',
    password: 'sua_senha_aqui',
    port: 5432,
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
