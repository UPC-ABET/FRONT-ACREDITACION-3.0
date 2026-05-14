export const APP_NAME = 'Sistema de Acreditación ABET'
export const DEFAULT_LOCALE = 'es'
export const DEFAULT_PAGE_SIZE = 5
export const APP_DESCRIPTION = 'Sistema ABET'

export const DEFAULT_CYCLE_LABEL = '2026-01'
export const DEFAULT_PROGRAM_TYPE = 'pregrado'
export const DEFAULT_USER_INITIALS = 'UA'

export type ProgramOption = {
  value: string
  label?: string
  labelKey?: string
}

export const DEFAULT_PROGRAM_OPTIONS: ProgramOption[] = [
  { value: 'pregrado', labelKey: 'navbar.program.regular' },
  { value: 'epe', labelKey: 'navbar.program.epe' },
]

export const STORAGE_KEYS = {
  locale: 'app_locale',
  sidebarOpen: 'sidebar_open',
} as const
