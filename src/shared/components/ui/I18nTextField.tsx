'use client';

import React, { useId } from 'react';
import { useI18n } from '@/providers';
import { useLanguages } from '@/shared/hooks';

export type I18nValue = Record<string, string>;

interface BaseProps {
	value: I18nValue;
	onChange: (next: I18nValue) => void;
	label?: string;
	required?: boolean;
	error?: string;
	disabled?: boolean;
	placeholder?: string;
	layout?: 'stacked' | 'row';
	className?: string;
	inputClassName?: string;
}

interface TextAreaVariantProps extends BaseProps {
	as?: 'textarea';
	rows?: number;
}

interface InputVariantProps extends BaseProps {
	as: 'input';
}

export type I18nTextFieldProps = TextAreaVariantProps | InputVariantProps;

const inputBase =
	'w-full px-3 py-2 text-sm rounded-md border outline-none transition-all bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-200 focus:border-red-700 focus:ring-4 focus:ring-red-100 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed';
const textAreaBase = `${inputBase} resize-none`;

function languageLabel(t: (k: string) => string, code: string): string {
	const key = `language.name.${code}`;
	const name = t(key);
	if (name && name !== key) return `${name} (${code.toUpperCase()})`;
	return code.toUpperCase();
}

export function I18nTextField(props: I18nTextFieldProps) {
	const { t } = useI18n();
	const languages = useLanguages();
	const {
		value,
		onChange,
		label,
		required,
		error,
		disabled,
		placeholder,
		layout = 'stacked',
		className = '',
		inputClassName = '',
	} = props;
	const as = props.as ?? 'textarea';
	const rows = as === 'textarea' ? ((props as TextAreaVariantProps).rows ?? 4) : 0;
	const fieldsClass =
		layout === 'row' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'space-y-3';

	return (
		<div className={`space-y-2 ${className}`}>
			{label && (
				<label className="block text-base font-semibold text-zinc-900">
					{label}
					{required && <span className="ml-1 text-red-600">*</span>}
				</label>
			)}
			<div className={fieldsClass}>
				{languages.map((code) => (
					<PerLanguageField
						key={code}
						code={code}
						label={languageLabel(t, code)}
						value={value[code] ?? ''}
						onChange={(next) => onChange({ ...value, [code]: next })}
						as={as}
						rows={rows}
						disabled={disabled}
						placeholder={placeholder}
						inputClassName={inputClassName}
						invalid={Boolean(error)}
					/>
				))}
			</div>
			{error && <p className="font-medium text-xs text-red-500 italic">{error}</p>}
		</div>
	);
}

interface PerLangProps {
	code: string;
	label: string;
	value: string;
	onChange: (v: string) => void;
	as: 'input' | 'textarea';
	rows: number;
	disabled?: boolean;
	placeholder?: string;
	inputClassName?: string;
	invalid?: boolean;
}

function PerLanguageField({
	code,
	label,
	value,
	onChange,
	as,
	rows,
	disabled,
	placeholder,
	inputClassName = '',
	invalid,
}: PerLangProps) {
	const id = useId();
	const fieldClass = `${as === 'textarea' ? textAreaBase : inputBase} ${invalid ? 'border-red-500 ring-2 ring-red-500/20' : ''} ${inputClassName}`;
	return (
		<div className="flex flex-col w-full">
			<label htmlFor={id} className="font-medium text-xs mb-2 text-zinc-700 select-none">
				{label}
			</label>
			{as === 'textarea' ? (
				<textarea
					id={id}
					rows={rows}
					className={fieldClass}
					value={value}
					disabled={disabled}
					placeholder={placeholder}
					onChange={(e) => onChange(e.target.value)}
					lang={code}
				/>
			) : (
				<input
					id={id}
					type="text"
					className={fieldClass}
					value={value}
					disabled={disabled}
					placeholder={placeholder}
					onChange={(e) => onChange(e.target.value)}
					lang={code}
				/>
			)}
		</div>
	);
}
