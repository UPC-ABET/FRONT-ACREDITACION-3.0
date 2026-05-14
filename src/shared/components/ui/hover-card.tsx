"use client"

import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

function HoverCard({
                       ...props
                   }: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
    return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

function HoverCardTrigger({
                              ...props
                          }: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
    return (
        <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
    )
}

function HoverCardContent({
                              className,
                              align = "center",
                              sideOffset = 4,
                              ...props
                          }: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
    return (
        <HoverCardPrimitive.Portal data-slot="hover-card-portal">
            <HoverCardPrimitive.Content
                data-slot="hover-card-content"
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    "z-50 w-72 origin-[--radix-hover-card-content-transform-origin] rounded-xl border border-red-100 bg-white p-4 text-sm text-zinc-700 shadow-2xl ring-1 ring-zinc-100 outline-none duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                    className
                )}
                {...props}
            />
        </HoverCardPrimitive.Portal>
    )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
