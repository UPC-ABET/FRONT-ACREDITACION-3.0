'use client'
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/solid'
import { useI18n } from '@/providers'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
    isOpen: boolean;
    onClose: () => void;
    type?: ToastType;
    message?: string;
    title?: string;
}

const toastConfig = {
    success: {
        icon: CheckCircleIcon,
        iconColor: 'text-emerald-500',
        titleKey: 'toast.title.success',
        messageKey: 'toast.message.success',
    },
    error: {
        icon: XCircleIcon,
        iconColor: 'text-red-500',
        titleKey: 'toast.title.error',
        messageKey: 'toast.message.error',
    },
    warning: {
        icon: ExclamationTriangleIcon,
        iconColor: 'text-amber-500',
        titleKey: 'toast.title.warning',
        messageKey: 'toast.message.warning',
    },
    info: {
        icon: InformationCircleIcon,
        iconColor: 'text-blue-500',
        titleKey: 'toast.title.info',
        messageKey: 'toast.message.info',
    }
}

function Toast({ isOpen, onClose, type = 'success', message, title }: ToastProps) {
    const { t } = useI18n()

    if (!isOpen) return null;

    const { icon: Icon, iconColor, titleKey, messageKey } = toastConfig[type];
    const resolvedTitle = title !== undefined ? title : t(titleKey)
    const resolvedMessage = message !== undefined ? message : t(messageKey)

    return (
        <div className="fixed bottom-5 right-5 z-[200] animate-in slide-in-from-right duration-300">
            <div className="bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-zinc-800 min-w-[300px]">
                <Icon className={`h-6 w-6 shrink-0 ${iconColor}`} />

                <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        {resolvedTitle}
                    </p>
                    <p className="text-sm font-medium">
                        {resolvedMessage}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    aria-label={t('toast.close')}
                    className="ml-2 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors text-zinc-500 hover:text-white"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}

export {Toast}
