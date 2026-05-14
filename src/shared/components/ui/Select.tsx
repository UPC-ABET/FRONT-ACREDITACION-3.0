'use client'

import React, { useMemo, useState } from 'react'
import SelectBase, { type OnChangeValue } from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { useI18n } from '@/providers'

type OptionItem = {
    label: string
    value: string | number
    name?: string
    isNew?: boolean
}

type SelectSize = 'sm' | 'md'

export interface SelectProps {
    name?: string
    value?: OptionItem | OptionItem[] | null
    options: Array<OptionItem | { id?: string | number; value?: string | number; name?: string; label?: string }>
    label?: string
    error?: string
    isMulti?: boolean
    isSearchable?: boolean
    isClearable?: boolean
    isDisabled?: boolean
    isCreatable?: boolean
    maxLength?: number | null
    placeholder?: string
    size?: SelectSize
    onChange?: (name: string | undefined, value: OptionItem | OptionItem[] | null) => void
    onInputChange?: (value: string) => void
}

const getCodeFromName = (item: { name?: string; label?: string; value?: string | number; id?: string | number }) => {
    if (item?.label && !item?.name) {
        return item.label
    }

    const raw = item?.name ?? item?.label ?? ''
    if (raw.trim() === '') {
        return String(item?.value ?? item?.id ?? '')
    }
    const name = raw.trim()
    if (name.includes(' - ')) return name.split(' - ')[0].trim()
    const firstToken = name.split(' ')[0]
    return firstToken || name
}

function Select({
    name,
    value,
    options,
    label,
    error,
    isMulti = false,
    isSearchable = false,
    isClearable = false,
    isDisabled = false,
    isCreatable = false,
    maxLength = null,
    placeholder,
    size = 'md',
    onChange,
    onInputChange,
}: SelectProps) {
    const [inputValue, setInputValue] = useState('')
    const selectId = React.useId()
    const { t } = useI18n()

    const formattedOptions = useMemo<OptionItem[]>(() => {
        return options.map((item) => {
            const raw = item as { id?: string | number; value?: string | number; name?: string; label?: string }
            return {
                label: getCodeFromName(raw),
                value: raw.id ?? raw.value ?? '',
                name: raw.name ?? raw.label,
            }
        })
    }, [options])

    const handleChange = (selected: OnChangeValue<OptionItem, boolean>) => {
        const normalized = Array.isArray(selected)
            ? [...selected] as OptionItem[]
            : (selected as OptionItem | null)

        setInputValue('')
        onChange?.(name, normalized)
    }

    const handleInputChange = (newValue: string) => {
        if (maxLength && newValue.length > maxLength) return
        setInputValue(newValue)
        onInputChange?.(newValue)
    }

    const handleCreateOption = (newValue: string) => {
        if (maxLength && newValue.length > maxLength) return
        const newOption: OptionItem = { label: newValue, value: newValue, isNew: true }
        onChange?.(name, newOption)
        setInputValue('')
    }

    const controlHeight = size === 'sm' ? 32 : 40
    const fontSize = size === 'sm' ? 12 : 14
    const paddingY = size === 'sm' ? 2 : 6
    const paddingX = size === 'sm' ? 8 : 10

    const selectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            minHeight: controlHeight,
            borderRadius: 6,
            borderColor: error ? '#ef4444' : state.isFocused ? '#dc2626' : '#e4e4e7',
            boxShadow: 'none',
            fontSize,
            ':hover': {
                borderColor: state.isFocused ? '#dc2626' : '#d4d4d8',
            },
        }),
        valueContainer: (base: any) => ({
            ...base,
            paddingTop: paddingY,
            paddingBottom: paddingY,
            paddingLeft: paddingX,
            paddingRight: paddingX,
        }),
        input: (base: any) => ({
            ...base,
            margin: 0,
            padding: 0,
        }),
        indicatorsContainer: (base: any) => ({
            ...base,
            minHeight: controlHeight,
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fee2e2' : 'white',
            color: state.isSelected ? 'white' : '#111827',
        }),
    }

    const commonProps = {
        inputId: selectId,
        instanceId: selectId,
        value,
        options: formattedOptions,
        inputValue,
        isMulti,
        isSearchable,
        isClearable,
        isDisabled,
        placeholder: placeholder || t('select.placeholder.default'),
        menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
        menuPosition: 'fixed' as const,
        styles: selectStyles,
        onChange: handleChange,
        onInputChange: (newValue: string) => {
            handleInputChange(newValue)
            return newValue
        },
    }

    return (
        <div className="flex flex-col w-full">
            {label && (
                <label className="font-medium text-xs mb-2 text-zinc-700 select-none">
                    {label}
                </label>
            )}

            {isCreatable ? (
                <CreatableSelect<OptionItem, boolean>
                    {...commonProps}
                    onCreateOption={handleCreateOption}
                    formatCreateLabel={(val: string) => t('select.createLabel').replace('{value}', val)}
                />
            ) : (
                <SelectBase<OptionItem, boolean> {...commonProps} />
            )}

            {error && (
                <p className="font-medium text-xs mt-2 text-red-500 italic leading-none">
                    {error}
                </p>
            )}
        </div>
    )
}

export { Select }
