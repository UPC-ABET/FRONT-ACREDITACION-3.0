/**
 * PROVIDERS
 *
 * Providers globales de la aplicación.
 *
 * Aquí sí va:
 * - theme provider
 * - session provider
 * - query provider
 * - app providers
 *
 * Aquí NO va:
 * - lógica de negocio específica
 * - componentes visuales del dominio
 *
 * Regla:
 * esta carpeta centraliza contextos/proveedores globales.
 */

export * from './locale-provider'
export * from './sidebar-provider'
export * from './abet-provider'
