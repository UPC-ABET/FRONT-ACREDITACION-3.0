'use client';

import React, { forwardRef, useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	trailingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, helperText, trailingIcon, className = '', id, ...props }, ref) => {
		const generatedId = useId();
		const inputId = id ?? generatedId;

		return (
			<div className="flex flex-col w-full">
				{label && (
					<label
						htmlFor={inputId}
						className="block text-sm font-normal text-zinc-600 mb-2 select-none">
						{label}
						{props.required && <span className="ml-1 text-red-600">*</span>}
					</label>
				)}

				<div className="relative">
					<input
						id={inputId}
						ref={ref}
						className={`
              w-full px-3 py-2 text-sm rounded-md border outline-none transition-all
              bg-white text-zinc-900 
              placeholder:text-zinc-400
              border-zinc-200 focus:border-red-700
              disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed
              ${trailingIcon ? 'pr-10' : ''}
              ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''}
              ${className}
            `}
						{...props}
					/>
					{trailingIcon && (
						<span
							className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400"
							aria-hidden="true">
							{trailingIcon}
						</span>
					)}
				</div>

				{error ? (
					<p className="font-medium text-xs mt-2 text-red-500 italic">{error}</p>
				) : helperText ? (
					<p className="font-medium text-xs mt-2 text-zinc-500">{helperText}</p>
				) : null}
			</div>
		);
	},
);

Input.displayName = 'Input';
