'use client'

import { PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { OutcomeWithCriteria } from '../../types'

interface OutcomeCardProps {
  outcome: OutcomeWithCriteria
  canEdit: boolean
  emptyMessage: string
  emptyMessageWithHint: string
  onAdd?: () => void
  children: React.ReactNode
}

const TRUNC = 100

export function OutcomeCard({ outcome, canEdit, emptyMessage, emptyMessageWithHint, onAdd, children }: OutcomeCardProps) {
  const { locale } = useI18n()
  const description = outcome.outcomeDescription[locale]
  const short = description.length > TRUNC ? `${description.slice(0, TRUNC)}…` : description
  const hasContent = outcome.questions.length > 0

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <header className="border-b border-zinc-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col">
            <p className="text-xs text-zinc-400 uppercase tracking-wide">Outcome</p>
            <p className="text-sm font-semibold">{outcome.outcomeCode}</p>
          </div>
          <div className="m-2 h-10 w-px bg-zinc-100" />
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-zinc-900" title={description}>
              {short}
            </span>
            <p className="text-xs text-zinc-500">{description}</p>
          </div>
          {canEdit && onAdd ? (
            <Button
              type="button"
              variant="surface"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onAdd}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </header>
      <div className="mt-4 space-y-2">
        {hasContent ? children : <p className="text-sm text-amber-700">{canEdit ? emptyMessageWithHint : emptyMessage}</p>}
      </div>
    </section>
  )
}
