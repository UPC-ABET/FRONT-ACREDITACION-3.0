"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/shared/lib/utils"

function Separator({
                       className,
                       orientation = "horizontal",
                       decorative = true,
                       ...props
                   }: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) {
    return (
        <SeparatorPrimitive.Root
            data-slot="separator"
            decorative={decorative}
            orientation={orientation}
            className={cn(
                "shrink-0 bg-zinc-900 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:h-full",
                className
            )}
            {...props}
        />
    )
}

export { Separator }
