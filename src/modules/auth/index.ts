/**
 * AUTH MODULE
 *
 * Este módulo contiene todo lo relacionado a autenticación y autorización.
 *
 * Aquí sí va:
 * - login
 * - logout
 * - registro
 * - recuperación de contraseña
 * - refresh token
 * - sesión actual
 * - guards/helpers de auth
 * - validaciones de credenciales
 *
 * Aquí NO va:
 * - componentes globales genéricos
 * - lógica de usuarios de negocio
 * - tablas administrativas
 * - utilidades compartidas entre toda la app
 *
 * Subcarpetas:
 * - components: UI propia de auth
 * - services: llamadas a API / integraciones
 * - hooks: hooks de auth
 * - schemas: validaciones
 * - types: tipos/interfaces
 * - constants: constantes del contexto
 * - utils: helpers exclusivos de auth
 * - actions: server actions o acciones del módulo
 */

export * from './components'
export * from './services'
export * from './hooks'
export * from './schemas'
//export * from './types'
export * from './constants'
//export * from './utils'
//export * from './actions'
export  * from  './Login'