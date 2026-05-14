'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/providers'

export default function HomeClient() {
  const router = useRouter()
  const { t } = useI18n()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('bearerToken')

    if (!token) {
      router.replace('/auth/login')
      return
    }

    setReady(true)
  }, [router])

  if (!ready) {
    return null
  }

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
        {t('welcome')}
      </h1>
    </div>
  )
}
