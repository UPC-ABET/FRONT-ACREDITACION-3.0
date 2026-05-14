'use client'

import React, { useEffect, useRef, useState } from 'react'

import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { Button } from '@/shared/components'
import { useI18n } from '@/providers'
import { cn } from '@/shared/lib/utils'

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (nextLocale: 'es' | 'en') => {
    setLocale(nextLocale)
    setOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 gap-2 px-2 rounded-lg"
      >
        <GlobeAltIcon className="h-5 w-5 text-zinc-600" />
        <span className="text-xs font-semibold text-zinc-700">
          {locale.toUpperCase()}
        </span>
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 min-w-[96px] rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSelect('es')}
            aria-pressed={locale === 'es'}
            className={cn(
              'h-7 w-full justify-start px-2 text-xs',
              locale === 'es' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
          >
            {t('language.es')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSelect('en')}
            aria-pressed={locale === 'en'}
            className={cn(
              'h-7 w-full justify-start px-2 text-xs',
              locale === 'en' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
          >
            {t('language.en')}
          </Button>
        </div>
      )}
    </div>
  )
}

export { LanguageSwitcher }
