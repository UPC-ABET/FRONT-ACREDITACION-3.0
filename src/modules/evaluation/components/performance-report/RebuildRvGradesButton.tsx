'use client';

import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button, ConfirmDialog, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib';
import { interpolate, tryTranslate } from '@/shared/utils';
import { useRebuildProcessedRvGrades } from '../../hooks/useProcessedRvGrades';
import type { RvGradeRebuildResultDto } from '../../types';

type ToastState = {
	isOpen: boolean;
	type: 'success' | 'error' | 'warning';
	message: string;
};

const CLOSED_TOAST: ToastState = { isOpen: false, type: 'success', message: '' };

interface RebuildRvGradesButtonProps {
	readonly disabled?: boolean;
	/** Highlights the button when formulas changed and the period has not been reprocessed yet. */
	readonly highlighted?: boolean;
	readonly onRebuilt?: () => void;
}

export function RebuildRvGradesButton({
	disabled = false,
	highlighted = false,
	onRebuilt,
}: RebuildRvGradesButtonProps) {
	const { t } = useI18n();
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [toast, setToast] = useState<ToastState>(CLOSED_TOAST);
	const rebuild = useRebuildProcessedRvGrades();

	// Skipped conversions are not a failure: the rubric simply did not grade every outcome the
	// formula needs. They are surfaced as a warning so the run still reports what it wrote.
	const buildResultToast = (result: RvGradeRebuildResultDto): ToastState => {
		const summary = interpolate(t('processedRvGrades.rebuild.success'), {
			evaluations: result.evaluationsProcessed,
			graded: result.gradedRows,
			converted: result.convertedRows,
		});

		if (result.skippedConversions === 0) {
			return { isOpen: true, type: 'success', message: summary };
		}

		const skipped = interpolate(t('processedRvGrades.rebuild.skipped'), {
			skipped: result.skippedConversions,
		});
		return { isOpen: true, type: 'warning', message: `${summary} ${skipped}` };
	};

	const handleConfirm = () => {
		rebuild.mutate(undefined, {
			onSuccess: (result) => {
				setIsConfirmOpen(false);
				setToast(buildResultToast(result));
				onRebuilt?.();
			},
			onError: (error) => {
				setIsConfirmOpen(false);
				setToast({
					isOpen: true,
					type: 'error',
					message: tryTranslate(t, getErrorMessage(error, 'processedRvGrades.rebuild.error')),
				});
			},
		});
	};

	return (
		<>
			<Button
				variant={highlighted ? 'primary' : 'surface'}
				size="sm"
				disabled={disabled || rebuild.isPending}
				loading={rebuild.isPending}
				onClick={() => setIsConfirmOpen(true)}>
				<ArrowPathIcon className="mr-1 h-4 w-4" aria-hidden="true" />
				{t('processedRvGrades.rebuild.action')}
			</Button>

			<ConfirmDialog
				isOpen={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				title={t('processedRvGrades.rebuild.confirmTitle')}
				message={t('processedRvGrades.rebuild.confirmMessage')}
				confirmLabel={t('processedRvGrades.rebuild.action')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirm}
				onDecline={() => setIsConfirmOpen(false)}
				isLoading={rebuild.isPending}
			/>

			<Toast
				isOpen={toast.isOpen}
				type={toast.type}
				message={toast.message}
				onClose={() => setToast(CLOSED_TOAST)}
			/>
		</>
	);
}
