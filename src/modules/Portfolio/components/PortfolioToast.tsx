'use client'

import { useEffect } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid'

interface PortfolioToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

/**
 * Toast inline migrado de UPC-SA-2025-FRONTEND/.../Portfolio/toast.jsx
 * Se cierra solo despues de 1700ms.
 */
export function PortfolioToast({
  message,
  type = 'info',
  onClose,
}: PortfolioToastProps) {
  useEffect(() => {
    const timerId = setTimeout(onClose, 1700)
    return () => clearTimeout(timerId)
  }, [message, onClose])

  const colorClass =
    type === 'success'
      ? 'bg-emerald-300'
      : type === 'error'
        ? 'bg-red-400'
        : 'bg-gray-400'

  return (
    <div
      onClick={onClose}
      className={`flex items-center justify-center fixed rounded-full bottom-0 right-0 mr-5 mb-5 p-4 shadow-md transition duration-300 ease-in-out transform hover:scale-105 z-50 cursor-pointer ${colorClass}`}
    >
      <span>{message}</span>

      {type === 'error' && (
        <button onClick={onClose} className="text-white ml-2" aria-label="Cerrar">
          <XMarkIcon className="h-6 w-6 text-stone-950" aria-hidden="true" />
        </button>
      )}

      {type === 'success' && (
        <button onClick={onClose} className="text-white ml-2" aria-label="Cerrar">
          <CheckIcon className="h-6 w-6 text-stone-950" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default PortfolioToast
