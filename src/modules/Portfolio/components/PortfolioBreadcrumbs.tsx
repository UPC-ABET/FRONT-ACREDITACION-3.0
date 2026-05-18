'use client'

import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import type { PortfolioFileItem, PortfolioRouteItem } from '../types'

interface PortfolioBreadcrumbsProps {
  pages: PortfolioRouteItem[]
  onHandleClickDocument?: (
    documento: Pick<PortfolioFileItem, 'name' | 'esDirectorio'> & { dir: string; directorio: boolean },
    index?: number,
    pages?: PortfolioRouteItem[]
  ) => void
  showFNav?: boolean
}

/**
 * Reemplazo del componente Breadcrumbs del frontend antiguo.
 * Mantiene la misma API: onHandleClickDocument({ name, dir, directorio }, index, pages).
 */
export function PortfolioBreadcrumbs({
  pages,
  onHandleClickDocument,
}: PortfolioBreadcrumbsProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-x-2 gap-y-1">
        {pages.map((page, index) => {
          const isLast = index === pages.length - 1
          const isFirst = index === 0
          const handleClick = () => {
            if (!onHandleClickDocument) return
            onHandleClickDocument(
              { name: page.name, dir: page.dir, esDirectorio: true, directorio: true },
              index,
              pages
            )
          }

          return (
            <li key={`${page.name}-${index}`} className="flex items-center">
              {!isFirst && (
                <ChevronRightIcon
                  className="h-4 w-4 text-zinc-400 mr-2"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={handleClick}
                disabled={isLast || !onHandleClickDocument}
                className={
                  isLast
                    ? 'flex items-center gap-1 text-sm font-semibold text-zinc-900'
                    : 'flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-red-600'
                }
              >
                {isFirst ? (
                  <HomeIcon className="h-4 w-4" aria-hidden="true" />
                ) : null}
                <span className="capitalize">{page.name}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default PortfolioBreadcrumbs
