'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Input, Select, Button, LoadingDialog, ErrorDialog } from '@/shared/components'
import { LoginPayload } from '@/shared/types'
import { loginByCredentials } from '@/modules/auth/services'
import { schoolOptions } from '@/modules/auth/constants'
import { useI18n } from '@/providers'

export default function LoginForm() {
  const [escuela, setEscuela] = useState('')
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')
  const router = useRouter()
  const { t } = useI18n()

  const localizedSchools = useMemo(
    () => schoolOptions.map((option) => ({ id: option.id, label: t(option.labelKey) })),
    [t]
  )

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    setDialogOpen(false)

    if (!escuela || !codigo || !password) {
      setError(t('login.error.required'))
      return
    }

    const payload: LoginPayload = { escuela, codigo, password }
    setLoading(true)
    try {
      const res = await loginByCredentials(payload)
      localStorage.setItem('bearerToken', JSON.stringify(res.accessToken))
      localStorage.setItem('token', JSON.stringify(res.user))
      localStorage.setItem('escuela', JSON.stringify(escuela))
      router.replace('/')
      // aquí podrías setear auth en contexto si existe
    } catch (err: any) {
      const rawMessage = typeof err?.message === 'string' ? err.message : ''
      const translated = rawMessage ? t(rawMessage) : ''
      const resolvedMessage =
        translated && translated !== rawMessage ? translated : (rawMessage || t('login.error.generic'))
      setDialogMessage(resolvedMessage)
      setDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleMicrosoftLogin = async () => {
    await signIn('azure-ad', { callbackUrl: '/' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div>
          <Select
            name="escuela"
            value={escuela ? { label: escuela, value: escuela } : null}
            onChange={(_, v) => setEscuela((v as any)?.value || '')}
            options={localizedSchools}
            placeholder={t('login.school.placeholder')}
          />
        </div>

        <div>
          <Input
            id="codigo"
            value={codigo}
            onChange={(e: any) => setCodigo(e.target.value)}
            placeholder={t('login.user.placeholder')}
          />
        </div>

        <div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            placeholder={t('login.password.placeholder')}
          />
        </div>
      </div>

      <div className="flex items-center">
        <label className="flex items-center text-sm">
          <input type="checkbox" className="mr-2" /> {t('login.remember')}
        </label>
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full">{t('login.submit')}</Button>
        <div className="text-center">
          <a href="#" className="text-sm text-red-600">{t('login.forgot')}</a>
        </div>
      </div>

      {loading && <LoadingDialog isOpen={loading} label={t('login.loading')} />}
      <ErrorDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        message={dialogMessage}
      />
    </form>
  )
}
