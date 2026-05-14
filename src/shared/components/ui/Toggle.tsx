'use client'
import { Switch as HeadlessSwitch } from '@headlessui/react'

interface SwitchProps {
    label?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
}

function Toggle({ label, checked, onChange, description }: SwitchProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            {(label || description) && (
                <div className="flex flex-col">
                    {label && <span className="text-xs font-bold text-zinc-800 uppercase">{label}</span>}
                    {description && <span className="text-xs text-zinc-500">{description}</span>}
                </div>
            )}
            <HeadlessSwitch
                checked={checked}
                onChange={onChange}
                className={`${
                    checked ? 'bg-red-600' : 'bg-zinc-200'
                } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            >
        <span
            className={`${
                checked ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
            </HeadlessSwitch>
        </div>
    )
}

export {Toggle};
