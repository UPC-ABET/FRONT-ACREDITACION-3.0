'use client'
import React from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui'
import { useI18n } from '@/providers'

type LoadingModalProps = {
  isOpen: boolean
  label?: string
  onClose?: () => void
}

function LoadingDialog({
  isOpen,
  label,
  onClose,
}: LoadingModalProps) {
  const { t } = useI18n()
  const resolvedLabel = label ?? t('loading.default')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose?.() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ArrowPathIcon className="h-8 w-8 text-red-600 animate-spin" aria-hidden="true" />
          </div>
          <DialogTitle className="mt-3 text-base font-semibold leading-6 text-zinc-900">
            {resolvedLabel}
          </DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export {LoadingDialog}
