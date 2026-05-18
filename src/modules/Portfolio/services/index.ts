/**
 * SERVICES
 *
 * Servicios del modulo Portfolio.
 */

// portfolioApiClient y portfolioSession exponen ambos getToken();
// re-exportamos el del session como nombre principal y mantenemos
// disponible el cliente HTTP base via su namespace.
export {
  API_URL,
  buildHeaders,
  getApiData,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUploadFormData,
} from './portfolioApiClient'

export {
  getToken,
  getUser,
  getSchool,
  getUserId,
  getUserCode,
  getPortfolioConfiguration,
  getAllowedRoutes,
  getPortfolioSession,
} from './portfolioSession'

export * from './projectPortfolioService'
export * as s3Service from './s3Service'
