/**
 * APP / API
 *
 * Endpoints API específicos del routing de Next.js (App Router).
 * En Next.js con App Router normalmente cada endpoint vive como
 * `route.ts` dentro de su carpeta (p. ej. `app/api/auth/route.ts`).
 *
 * Aquí sí va:
 * - carpetas de endpoints (ej: auth/, users/)
 * - helpers o utilidades "del endpoint" que solo se usan por las rutas
 *
 * Aquí NO va:
 * - lógica de negocio compleja (mover a `modules/`)
 * - clientes HTTP reutilizables (mover a `shared/lib`)
 *
 * Ejemplos de archivos esperados:
 * - app/api/auth/route.ts
 * - app/api/users/route.ts
 * - app/api/health/route.ts
 */

// export * from './auth'

export {}
