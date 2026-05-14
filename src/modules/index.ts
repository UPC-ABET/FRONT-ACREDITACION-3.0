/**
 * APP
 *
 * Esta carpeta contiene únicamente:
 * - rutas de Next.js
 * - layout.tsx
 * - layout.tsx
 * - loading.tsx
 * - error.tsx
 * - route.ts
 * - templates específicos de routing
 *
 * NO colocar aquí:
 * - lógica de negocio
 * - fetchs complejos
 * - validaciones de dominio
 * - componentes reutilizables grandes
 *
 * Regla:
 * app solo orquesta pantallas y conecta módulos.
 */

export * from './auth'
export * from './tests'
export * from '../shared/components/errors'
