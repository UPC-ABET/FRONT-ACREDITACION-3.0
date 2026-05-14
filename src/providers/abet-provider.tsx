'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'
import type { ABETContextType } from '@/shared/types'

const ABETContext = createContext<ABETContextType | null>(null)

export function ABETProvider({ children }: { children: React.ReactNode }) {
  const [valueModality, setValueModality] = useState<string | number>('default')

  const value = useMemo<ABETContextType>(() => ({ valueModality, setValueModality }), [valueModality])

  return <ABETContext.Provider value={value}>{children}</ABETContext.Provider>
}

export function useABET() {
  const ctx = useContext(ABETContext)
  if (!ctx) throw new Error('useABET must be used within ABETProvider')
  return ctx
}

export default ABETContext
