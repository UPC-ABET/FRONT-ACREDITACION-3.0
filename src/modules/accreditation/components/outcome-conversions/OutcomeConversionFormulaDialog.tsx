'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	TextArea,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { interpolate, tryTranslate } from '@/shared/utils';
import { validateOutcomeConversionFormula } from '../../schemas';
import type { OutcomeConversion } from '../../types';

type SourceOutcome = {
	outcomeCode: string;
	outcomeName: string;
};

type Props = {
	targetOutcomeCode: string;
	targetCommissionCode: string;
	sourceCommissionCode: string;
	sourceOutcomes: SourceOutcome[];
	sourceOutcomesLoading: boolean;
	conversion: OutcomeConversion | null;
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSubmit: (formula: string) => void;
};

function insertAt(value: string, reference: string, start: number, end: number) {
	return {
		text: `${value.slice(0, start)}${reference}${value.slice(end)}`,
		caret: start + reference.length,
	};
}

export function OutcomeConversionFormulaDialog({
	targetOutcomeCode,
	targetCommissionCode,
	sourceCommissionCode,
	sourceOutcomes,
	sourceOutcomesLoading,
	conversion,
	saving,
	errorMessage,
	onClose,
	onSubmit,
}: Props) {
	const { t } = useI18n();
	const [formula, setFormula] = useState(conversion?.formula ?? '');
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const pendingCaretRef = useRef<number | null>(null);

	const sourceOutcomeCodes = useMemo(
		() => sourceOutcomes.map((outcome) => outcome.outcomeCode),
		[sourceOutcomes],
	);

	const validation = useMemo(
		() => validateOutcomeConversionFormula(formula, sourceOutcomeCodes),
		[formula, sourceOutcomeCodes],
	);

	// Chips write `[CODE]` at the caret; the caret is then restored past the inserted reference so
	// the user can keep typing the expression without reaching for the mouse.
	useEffect(() => {
		const caret = pendingCaretRef.current;
		if (caret == null || !textAreaRef.current) return;
		textAreaRef.current.focus();
		textAreaRef.current.setSelectionRange(caret, caret);
		pendingCaretRef.current = null;
	}, [formula]);

	const handleInsertReference = (outcomeCode: string) => {
		const textArea = textAreaRef.current;
		const start = textArea?.selectionStart ?? formula.length;
		const end = textArea?.selectionEnd ?? formula.length;
		const { text, caret } = insertAt(formula, `[${outcomeCode}]`, start, end);
		pendingCaretRef.current = caret;
		setFormula(text);
	};

	const isEmpty = formula.trim() === '';
	// While the source outcomes load, every reference would look unknown — hold the verdict back.
	const validationErrorKey = sourceOutcomesLoading || isEmpty ? null : validation.errorKey;
	const canSave = !isEmpty && !saving && !sourceOutcomesLoading && validation.errorKey == null;

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{conversion
							? t('outcomeConversions.formula.editTitle')
							: t('outcomeConversions.formula.createTitle')}
					</DialogTitle>
					<DialogDescription>
						{interpolate(t('outcomeConversions.formula.subtitle'), {
							targetOutcome: targetOutcomeCode,
							targetCommission: targetCommissionCode,
							sourceCommission: sourceCommissionCode,
						})}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<p className="text-sm font-semibold text-zinc-900">
							{interpolate(t('outcomeConversions.formula.sourceOutcomes'), {
								sourceCommission: sourceCommissionCode,
							})}
						</p>
						{sourceOutcomes.length === 0 ? (
							<p className="text-sm text-zinc-500">
								{sourceOutcomesLoading
									? t('outcomeConversions.formula.loadingSourceOutcomes')
									: t('outcomeConversions.formula.noSourceOutcomes')}
							</p>
						) : (
							<div className="flex flex-wrap gap-2">
								{sourceOutcomes.map((outcome) => (
									<Button
										key={outcome.outcomeCode}
										variant="surface"
										size="sm"
										className="font-mono"
										aria-label={interpolate(t('outcomeConversions.formula.insertReference'), {
											code: outcome.outcomeCode,
										})}
										onClick={() => handleInsertReference(outcome.outcomeCode)}>
										{outcome.outcomeCode}
									</Button>
								))}
							</div>
						)}
					</div>

					<TextArea
						ref={textAreaRef}
						rows={3}
						required
						label={t('outcomeConversions.formula.label')}
						placeholder={t('outcomeConversions.formula.placeholder')}
						className="font-mono"
						value={formula}
						onChange={(event) => setFormula(event.target.value)}
						error={validationErrorKey ? tryTranslate(t, validationErrorKey) : undefined}
					/>

					<p className="text-xs text-zinc-500">{t('outcomeConversions.formula.hint')}</p>

					{validation.references.length > 0 && validation.errorKey == null && (
						<div className="space-y-2">
							<p className="text-sm font-semibold text-zinc-900">
								{t('outcomeConversions.formula.referencedOutcomes')}
							</p>
							<div className="flex flex-wrap gap-2">
								{validation.references.map((code) => (
									<Badge key={code} variant="outline" className="font-mono">
										{code}
									</Badge>
								))}
							</div>
						</div>
					)}

					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button
						variant="primary"
						disabled={!canSave}
						loading={saving}
						onClick={() => onSubmit(formula.trim())}>
						{t('outcomeConversions.formula.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
