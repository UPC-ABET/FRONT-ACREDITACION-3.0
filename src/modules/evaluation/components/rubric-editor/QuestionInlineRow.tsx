'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { OutcomeQuestion } from '../../types';
import { cn } from '@/shared/lib/utils';

function isValidText(s: string): boolean {
	return s.trim().length > 0;
}

function isTempId(id: string): boolean {
	return id.startsWith('temp-');
}

export interface QuestionInlineRowProps {
	question: OutcomeQuestion;
	index: number;
	canEdit: boolean;
	isSaving: boolean;
	savingLabel: string;
	placeholder: string;
	labelPrefix: string;
	onTextChange?: (questionId: string, text: string) => void;
	onPatch: (questionId: string, text: string) => Promise<void>;
	onCreate: (text: string) => Promise<void>;
	onDeletePersisted: (questionId: string) => Promise<void>;
	onDeleteLocal: (questionId: string) => void;
	onNotifyRetry: () => void;
}

async function withSingleRetry<T>(fn: () => Promise<T>, onRetry: () => void): Promise<T> {
	try {
		return await fn();
	} catch {
		onRetry();
		return await fn();
	}
}

export function QuestionInlineRow({
	question,
	index,
	canEdit,
	isSaving,
	savingLabel,
	placeholder,
	labelPrefix,
	onTextChange,
	onPatch,
	onCreate,
	onDeletePersisted,
	onDeleteLocal,
	onNotifyRetry,
}: QuestionInlineRowProps) {
	const { locale, t } = useI18n();
	const currentText = question.questionText[locale];

	const [text, setText] = useState(currentText);
	const [trashHovered, setTrashHovered] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const focusedRef = useRef(false);

	useEffect(() => {
		if (!focusedRef.current) {
			setText(question.questionText[locale]);
		}
	}, [question.questionText, question.id, locale]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const flushPatch = useCallback(async () => {
		if (!canEdit || isTempId(question.id)) return;
		const trimmed = text.trim();
		if (!isValidText(trimmed) || trimmed === currentText) return;
		await withSingleRetry(() => onPatch(question.id, trimmed), onNotifyRetry);
	}, [canEdit, currentText, question.id, onPatch, onNotifyRetry, text]);

	useEffect(() => {
		if (!canEdit || isTempId(question.id)) return;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			void flushPatch();
		}, 800);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [text, canEdit, question.id, flushPatch]);

	const handleBlur = async () => {
		focusedRef.current = false;
		if (!canEdit) return;
		if (isTempId(question.id)) {
			const trimmed = text.trim();
			if (!isValidText(trimmed)) return;
			await withSingleRetry(() => onCreate(trimmed), onNotifyRetry);
			return;
		}
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}
		await flushPatch();
	};

	const handleDelete = async () => {
		if (isTempId(question.id)) {
			onDeleteLocal(question.id);
			return;
		}
		await withSingleRetry(() => onDeletePersisted(question.id), onNotifyRetry);
	};

	return (
		<div
			className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
				trashHovered ? 'border-red-200 bg-red-50' : 'border-zinc-100 bg-zinc-50/80'
			}`}>
			<span
				className={`shrink-0 text-xs font-semibold uppercase tracking-wide transition-colors ${
					trashHovered ? 'text-red-400' : 'text-zinc-500'
				}`}>
				{labelPrefix} {index + 1}
			</span>
			<div className="relative min-w-[12rem] flex-1">
				<Input
					value={text}
					disabled={!canEdit}
					placeholder={placeholder}
					onChange={(e) => {
						setText(e.target.value);
						onTextChange?.(question.id, e.target.value);
					}}
					onFocus={() => {
						focusedRef.current = true;
					}}
					onBlur={() => void handleBlur()}
					className={cn('w-full transition-colors', trashHovered && 'border-red-200')}
				/>
				{isSaving ? (
					<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
						{savingLabel}
					</span>
				) : null}
			</div>
			{canEdit ? (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="shrink-0"
					onMouseEnter={() => setTrashHovered(true)}
					onMouseLeave={() => setTrashHovered(false)}
					onClick={() => void handleDelete()}>
					<TrashIcon
						className={cn(
							'h-5 w-5 transition-colors',
							trashHovered ? 'text-red-500' : 'text-zinc-500',
						)}
						aria-hidden
					/>
					<span className="sr-only">{t('rubrics.editor.delete')}</span>
				</Button>
			) : null}
		</div>
	);
}
