'use client';
import React, { forwardRef, useId } from 'react';
import { cn } from '@/shared/lib/utils';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	({ label, error, className = '', ...props }, ref) => {
		const id = useId();
		return (
			<div className="flex flex-col w-full">
				{label && (
					<label
						htmlFor={id}
						className="block text-base font-semibold text-zinc-900 mb-2 select-none">
						{label}
						{props.required && <span className="ml-1 text-red-600">*</span>}
					</label>
				)}
				<textarea
					id={id}
					ref={ref}
					rows={4}
					className={cn(
						'w-full px-3 py-2 text-sm rounded-md border outline-none transition-all bg-white text-zinc-900 border-red-600 focus:border-red-700 focus:ring-4 focus:ring-red-100 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none',
						error && 'border-red-500 ring-2 ring-red-500/20',
						className,
					)}
					{...props}
				/>
				{error && <p className="font-medium text-xs mt-2 text-red-500 italic">{error}</p>}
			</div>
		);
	},
);
TextArea.displayName = 'TextArea';

export default TextArea;
