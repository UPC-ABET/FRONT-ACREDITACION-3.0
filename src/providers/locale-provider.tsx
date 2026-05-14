'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import esMessages from '@/languaje/locales/es.json'
import enMessages from '@/languaje/locales/en.json'

type Locale = 'es' | 'en'

type I18nContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const STORAGE_KEY = 'app_locale'
const DEFAULT_LOCALE: Locale = 'es'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

interface Messages {
  [key: string]: string | Messages
}

const messages: Record<Locale, Messages> = {
  es: esMessages,
  en: enMessages,
}

const I18nContext = createContext<I18nContextType | null>(null)

function resolveMessage(locale: Locale, key: string) {
  const parts = key.split('.')
  let current: string | Messages | undefined = messages[locale]

  for (const part of parts) {
    if (!current || typeof current !== 'object') return key
    current = current[part]
  }

  return typeof current === 'string' ? current : key
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  const persistLocale = useCallback((nextLocale: Locale) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
    document.documentElement.lang = nextLocale
    document.cookie = `${STORAGE_KEY}=${nextLocale}; path=/; max-age=${COOKIE_MAX_AGE}`
  }, [])

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    persistLocale(nextLocale)
  }, [persistLocale])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === 'es' || stored === 'en') {
      setLocaleState(stored)
      document.documentElement.lang = stored
      document.cookie = `${STORAGE_KEY}=${stored}; path=/; max-age=${COOKIE_MAX_AGE}`
      return
    }

    const browserLocale = navigator.language.toLowerCase()
    const inferred: Locale = browserLocale.startsWith('en') ? 'en' : 'es'
    setLocaleState(inferred)
    document.documentElement.lang = inferred
    window.localStorage.setItem(STORAGE_KEY, inferred)
    document.cookie = `${STORAGE_KEY}=${inferred}; path=/; max-age=${COOKIE_MAX_AGE}`
  }, [])

  const t = useCallback((key: string) => resolveMessage(locale, key), [locale])

  const value = useMemo<I18nContextType>(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider')
  return ctx
}
