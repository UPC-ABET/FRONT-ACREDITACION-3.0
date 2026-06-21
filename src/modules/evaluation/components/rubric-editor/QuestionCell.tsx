'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';

interface QuestionCellProps {
	questionText: string;
	questionIndex: number;
	canEdit: boolean;
	labelPrefix: string;
	placeholder: string;
	onTextChange: (text: string) => void;
	isHovered?: boolean;
}

export function QuestionCell({
	questionText,
	questionIndex,
	canEdit,
	labelPrefix,
	placeholder,
	onTextChange,
	isHovered,
}: QuestionCellProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	}, [questionText]);

	return (
		<div className="space-y-1.5 p-3">
			<span
				className={cn(
					'text-xs font-semibold uppercase tracking-wide transition-colors duration-300',
					isHovered ? 'text-red-600' : 'text-zinc-500',
				)}>
				{labelPrefix} {questionIndex + 1}
			</span>
			<textarea
				ref={textareaRef}
				value={questionText}
				disabled={!canEdit}
				placeholder={placeholder}
				rows={2}
				className="w-full resize-none overflow-hidden rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-50 disabled:text-zinc-500"
				onChange={(e) => onTextChange(e.target.value)}
			/>
		</div>
	);
}
