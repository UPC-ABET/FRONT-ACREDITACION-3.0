'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components'
import { useI18n } from '@/providers'

function NotFoundPage() {
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    document.body.classList.add('not-found')
    return () => document.body.classList.remove('not-found')
  }, [])

  const handleGoHome = () => {
    const token = localStorage.getItem('bearerToken')

    if (token) {
      router.push('/')
    } else {
      router.push('/auth/login')
    }
  }

  return (
    <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-red-600">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          {t('notFound.title')}
        </h1>
        <p className="mt-6 text-base leading-7 text-zinc-600">
          {t('notFound.message')}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button type="button" onClick={handleGoHome}>
            {t('notFound.action')}
          </Button>
        </div>
      </div>
    </main>
  )
}

export { NotFoundPage }
