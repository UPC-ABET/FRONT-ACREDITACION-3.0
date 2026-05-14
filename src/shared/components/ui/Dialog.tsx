"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XCircleIcon } from '@heroicons/react/24/outline';

import { cn } from "@/shared/utils"
import { Button } from '@/shared/components/ui';
import { useI18n } from '@/providers'

const mergeClassName = <T,>(
    base: string,
    className?: string | ((state: T) => string | undefined)
) => {
    if (typeof className === 'function') {
        return (state: T) => cn(base, className(state))
    }
    return cn(base, className)
}

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
                           className,
                           ...props
                       }: DialogPrimitive.Backdrop.Props) {
    return (
        <DialogPrimitive.Backdrop
            data-slot="dialog-overlay"
            className={mergeClassName(
                "fixed inset-0 isolate z-50 bg-zinc-900/70 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
                className
            )}
            {...props}
        />
    )
}

function DialogContent({
                           className,
                           children,
                           showCloseButton = true,
                       }: {
    className?: string
    children?: React.ReactNode
    showCloseButton?: boolean
}) {
    const { t } = useI18n()

    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Popup
                data-slot="dialog-content"
                render={(popupProps) => {
                    return (
                        <div
                            {...popupProps}
                            className={cn(
                                "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-1rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-2xl ring-1 ring-zinc-200 duration-100 outline-none sm:max-w-sm sm:p-6 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                                className
                            )}
                        >
                            {children}
                        </div>
                    )
                }}
            />
        </DialogPortal>
    )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-2", className)}
            {...props}
        />
    )
}

function DialogFooter({
                          className,
                          showCloseButton = false,
                          children,
                          ...props
                      }: React.ComponentProps<"div"> & {
    showCloseButton?: boolean
}) {
    const { t } = useI18n()

    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-zinc-100 bg-zinc-50/50 p-3 sm:-mx-6 sm:-mb-6 sm:p-4 sm:flex-row sm:justify-end",
                className
            )}
            {...props}
        >
            {children}
            {showCloseButton && (
                <DialogPrimitive.Close render={<Button variant="secondary">{t('dialog.close')}</Button>} />
            )}
        </div>
    )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={mergeClassName(
                "text-base leading-none font-semibold text-zinc-900",
                className
            )}
            {...props}
        />
    )
}

function DialogDescription({
                               className,
                               ...props
                           }: DialogPrimitive.Description.Props) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={mergeClassName(
                "text-sm text-zinc-500",
                className
            )}
            {...props}
        />
    )
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
}
