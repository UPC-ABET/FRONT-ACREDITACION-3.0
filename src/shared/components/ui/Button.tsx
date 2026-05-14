'use client'

import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
    'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-all outline-none select-none cursor-pointer border border-transparent bg-clip-padding focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
    {
      variants: {
        variant: {
          primary:   'bg-red-600 text-white hover:bg-red-400 focus-visible:ring-red-500',
          secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-400',
          ghost:     'bg-transparent text-current hover:bg-gray-100/20 focus-visible:ring-gray-400',
          dark:      'bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-600',
          surface:   'bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm hover:bg-zinc-200 focus-visible:ring-zinc-300',
          warning:   'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400',
          neutral:   'bg-zinc-500 text-white hover:bg-zinc-600 focus-visible:ring-zinc-400',
          info:      'bg-zinc-400 text-white hover:bg-zinc-500 focus-visible:ring-zinc-300',
        },
          size: {
              sm: 'h-7 px-2 py-1 text-sm gap-1',
              md: 'h-9 px-4 py-2 text-base gap-1.5',
              lg: 'h-11 px-6 py-3 text-lg gap-2',
              icon: 'h-9 w-9 p-0',
          },
      },
      defaultVariants: {
        variant: 'primary',
        size: 'md',
      },
    }
)

export type ButtonProps = ComponentPropsWithoutRef<typeof ButtonPrimitive> &
    VariantProps<typeof buttonVariants>

function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
      <ButtonPrimitive
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
      />
  )
}

export { Button, buttonVariants }