/**
 * Shared auth-related types
 */

export type LoginPayload = {
  escuela: string
  codigo: string
  password: string
}

export type ABETContextType = {
  /** Modalidad seleccionada (p. ej. presencial/virtual o un id) */
  valueModality: string | number
  setValueModality?: (v: string | number) => void
}
