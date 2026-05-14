'use client';

import * as React from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckIcon
} from '@heroicons/react/24/solid';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { useI18n } from '@/providers'

type BaseDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    onConfirm?: () => void;
    onDecline?: () => void;
}

type FormDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    title?: string;
    children: React.ReactNode;
}

function BaseFeedbackDialog({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
    onDecline,
    icon: Icon,
    iconBg,
    iconColor,
    dualActions = false,
}: BaseDialogProps & {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    iconBg: string;
    iconColor: string;
    dualActions?: boolean;
}) {
    const { t } = useI18n()

    const resolvedTitle = title ?? ''
    const resolvedMessage = message ?? ''
    const declineLabel = t('dialog.actions.decline')
    const acceptLabel = t('dialog.actions.accept')

    const actions: React.ReactNode = dualActions ? (
        <div className="mt-5 sm:mt-6 grid grid-cols-5 gap-3">
            <Button
                onClick={onDecline || onClose}
                variant="secondary"
                className="col-span-2 inline-flex w-full justify-center rounded-md bg-zinc-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
            >
                {declineLabel}
            </Button>
            <div className="col-span-1" />
            <Button
                onClick={onConfirm || onClose}
                variant="primary"
                className='col-span-2 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
            >
                {acceptLabel}
            </Button>
        </div>
    ) : (
        <div className="mt-5 sm:mt-6">
            <Button
                onClick={onConfirm || onClose}
                variant="primary"
                className='col-span-2 inline-flex w-full justify-center rounded-md  bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
            >
                {acceptLabel}
            </Button>
        </div>
    )

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent showCloseButton={false} className="max-w-sm">
                <div>
                    <div className="flex items-center justify-center space-x-5">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
                            <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
                        </div>
                        <DialogHeader className="gap-0">
                            <DialogTitle className="text-base font-semibold text-zinc-900">
                                {resolvedTitle}
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                        <p className="text-sm text-zinc-500">{resolvedMessage}</p>
                    </div>
                </div>

                {actions}
            </DialogContent>
        </Dialog>
    );
}

export function FormDialog({
    isOpen,
    onClose,
    onSubmit,
    title,
    children,
}: FormDialogProps) {
    const { t } = useI18n()
    const resolvedTitle = title ?? t('dialog.title.form')

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent showCloseButton={false} className="max-w-lg">
                <DialogHeader className="gap-0">
                    <DialogTitle className="text-base font-semibold text-zinc-900">
                        {resolvedTitle}
                    </DialogTitle>
                </DialogHeader>
                <div className="text-sm text-zinc-600">
                    {children}
                </div>
                <div className="mt-5 sm:mt-6 grid grid-cols-5 gap-3">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="col-span-2 inline-flex w-full justify-center rounded-md bg-zinc-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                    >
                        {t('dialog.actions.cancel')}
                    </Button>
                    <div className="col-span-1" />
                    <Button
                        onClick={onSubmit}
                        variant="primary"
                        className="col-span-2 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                        {t('dialog.actions.save')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function ErrorDialog({
    isOpen,
    onClose,
    title,
    message,
}: BaseDialogProps) {
    const { t } = useI18n()

    return (
        <BaseFeedbackDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title !== undefined ? title : t('dialog.title.error')}
            message={message !== undefined ? message : t('dialog.message.error')}
            icon={ExclamationTriangleIcon}
            iconBg="bg-red-100"
            iconColor="text-red-600"
        />
    )
}

export function SuccessDialog({
    isOpen,
    onClose,
    title,
    message,
}: BaseDialogProps) {
    const { t } = useI18n()

    return (
        <BaseFeedbackDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title !== undefined ? title : t('dialog.title.success')}
            message={message !== undefined ? message : t('dialog.message.success')}
            icon={CheckIcon}
            iconBg="bg-green-100"
            iconColor="text-green-600"
        />
    )
}

export function InfoDialog({
    isOpen,
    onClose,
    title,
    message,
}: BaseDialogProps) {
    const { t } = useI18n()

    return (
        <BaseFeedbackDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title !== undefined ? title : t('dialog.title.info')}
            message={message !== undefined ? message : t('dialog.message.info')}
            icon={InformationCircleIcon}
            iconBg="bg-blue-100"
            iconColor="text-blue-500"
        />
    )
}

export function WarningDialog({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
    onDecline,
}: BaseDialogProps) {
    const { t } = useI18n()

    return (
        <BaseFeedbackDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title !== undefined ? title : t('dialog.title.warning')}
            message={message !== undefined ? message : t('dialog.message.warning')}
            onConfirm={onConfirm}
            onDecline={onDecline}
            icon={InformationCircleIcon}
            iconBg="bg-amber-100"
            iconColor="text-amber-500"
            dualActions
        />
    )
}

export function ConfirmDialog({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
    onDecline,
}: BaseDialogProps) {
    const { t } = useI18n()

    return (
        <BaseFeedbackDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title !== undefined ? title : t('dialog.title.confirm')}
            message={message !== undefined ? message : t('dialog.message.confirm')}
            onConfirm={onConfirm}
            onDecline={onDecline}
            icon={CheckCircleIcon}
            iconBg="bg-red-100"
            iconColor="text-red-600"
            dualActions
        />
    )
}
