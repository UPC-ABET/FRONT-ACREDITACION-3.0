'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { CriteriaItem } from '../../types';

function isValidDescription(s: string): boolean {
	return s.trim().length > 0;
}

function isTempId(id: string): boolean {
	return id.startsWith('temp-');
}

export interface CriteriaInlineRowProps {
	criterion: CriteriaItem;
	index: number;
	canEdit: boolean;
	isSaving: boolean;
	savingLabel: string;
	placeholder: string;
	criteriaLabelPrefix: string;
	onTextChange?: (criteriaId: string, text: string) => void;
	onPatch: (criteriaId: string, description: string) => Promise<void>;
	onCreate: (description: string) => Promise<void>;
	onDeletePersisted: (criteriaId: string) => Promise<void>;
	onDeleteLocal: (criteriaId: string) => void;
	onNotifyRetry: () => void;
	onConfirmDelete: () => boolean;
}

async function withSingleRetry<T>(fn: () => Promise<T>, onRetry: () => void): Promise<T> {
	try {
		return await fn();
	} catch {
		onRetry();
		return await fn();
	}
}

export function CriteriaInlineRow({
	criterion,
	index,
	canEdit,
	isSaving,
	savingLabel,
	placeholder,
	criteriaLabelPrefix,
	onTextChange,
	onPatch,
	onCreate,
	onDeletePersisted,
	onDeleteLocal,
	onNotifyRetry,
	onConfirmDelete,
}: CriteriaInlineRowProps) {
	const { locale, t } = useI18n();
	const currentDescription = criterion.description[locale];

	const [text, setText] = useState(currentDescription);
	const [isFocused, setIsFocused] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const displayText = isFocused ? text : currentDescription;

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const flushPatch = useCallback(async () => {
		if (!canEdit || isTempId(criterion.id)) return;
		const trimmed = text.trim();
		if (!isValidDescription(trimmed) || trimmed === currentDescription) return;
		await withSingleRetry(() => onPatch(criterion.id, trimmed), onNotifyRetry);
	}, [canEdit, currentDescription, criterion.id, onPatch, onNotifyRetry, text]);

	useEffect(() => {
		if (!canEdit || isTempId(criterion.id)) return;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			void flushPatch();
		}, 800);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [text, canEdit, criterion.id, flushPatch]);

	const handleBlur = async () => {
		setIsFocused(false);
		if (!canEdit) return;
		if (isTempId(criterion.id)) {
			const trimmed = text.trim();
			if (!isValidDescription(trimmed)) return;
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
		if (!onConfirmDelete()) return;
		if (isTempId(criterion.id)) {
			onDeleteLocal(criterion.id);
			return;
		}
		await withSingleRetry(() => onDeletePersisted(criterion.id), onNotifyRetry);
	};

	return (
		<div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
			<span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">
				{criteriaLabelPrefix} {index + 1}
			</span>
			<div className="relative min-w-[12rem] flex-1">
				<Input
					value={displayText}
					disabled={!canEdit}
					placeholder={placeholder}
					onChange={(e) => {
						setText(e.target.value);
						onTextChange?.(criterion.id, e.target.value);
					}}
					onFocus={() => {
						setText(currentDescription);
						setIsFocused(true);
					}}
					onBlur={() => void handleBlur()}
					className="w-full"
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
					onClick={() => void handleDelete()}>
					<TrashIcon className="h-5 w-5 text-zinc-500" aria-hidden />
					<span className="sr-only">{t('rubrics.editor.delete')}</span>
				</Button>
			) : null}
		</div>
	);
}
