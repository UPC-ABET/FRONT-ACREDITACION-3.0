/**
 * SHARED
 *
 * Recursos compartidos entre múltiples módulos.
 *
 * Aquí sí va:
 * - componentes reutilizables
 * - utilidades genéricas
 * - tipos globales
 * - constantes globales
 * - clientes base de API
 *
 * Aquí NO va:
 * - lógica específica de auth, users, sales, etc.
 *
 * Regla:
 * shared debe ser transversal, no de negocio.
 */

export  * from './components'
export  * from './hooks'
export  * from './types'
export  * from './utils'
