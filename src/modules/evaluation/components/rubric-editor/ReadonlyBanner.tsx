'use client'

import { LockClosedIcon } from '@heroicons/react/24/solid'
import { useI18n } from '@/providers'
import { Alert, AlertDescription } from '@/shared/components/ui/Alert'

export function ReadonlyBanner() {
  const { t } = useI18n()

  return (
    <Alert variant="warning" className="flex items-start gap-3">
      <LockClosedIcon className="h-5 w-5 text-yellow-600" />
      <AlertDescription>{t('rubrics.editor.header.readonly')}</AlertDescription>
    </Alert>
  )
}
