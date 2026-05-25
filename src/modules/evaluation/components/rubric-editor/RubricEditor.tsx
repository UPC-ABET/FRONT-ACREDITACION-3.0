'use client';

import { useState } from 'react';
import { Skeleton } from '@/shared/components/ui';
import { Toast } from '@/shared/components/ui/Toast';
import { useI18n } from '@/providers';
import { useRubricEditor } from '../../hooks/use-rubric-editor';
import { RubricHeader } from './RubricHeader';
import { ReadonlyBanner } from './ReadonlyBanner';
import { RubricEditorCapstone } from './RubricEditorCapstone';
import { RubricEditorNonCapstone } from './RubricEditorNonCapstone';
import { RubricDetail } from '../../types';

interface RubricEditorProps {
	rubricId: string;
	initialRubric?: RubricDetail;
}

export function RubricEditor({ rubricId, initialRubric }: RubricEditorProps) {
	const { t } = useI18n();
	const [toastState, setToastState] = useState({
		open: false,
		type: 'info' as 'success' | 'error' | 'warning' | 'info',
		message: '',
	});

	const notify = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
		setToastState({ open: true, type, message });
	};

	const messages = {
		autosaveRetry: t('rubrics.editor.save.autosaveRetry'),
		saveSuccess: t('rubrics.editor.save.saveRubricSuccess'),
	};

	const { rubric, isLoading, isError, canEdit, queryKey, error } = useRubricEditor({
		rubricId,
		initialRubric,
	});

	const errorMessage = isError
		? (error as Error | null)?.message || t('rubrics.editor.error.load')
		: '';

	if (isLoading && !rubric) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!rubric) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
				{errorMessage || t('rubrics.editor.error.notFound')}
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<RubricHeader rubric={rubric} />

			{!canEdit ? <ReadonlyBanner /> : null}

			{rubric.isCapstone && rubric.gradeTypeCode === 'TG205-T002' ? (
				<RubricEditorCapstone
					rubric={rubric}
					rubricId={rubricId}
					canEdit={canEdit}
					queryKey={queryKey}
					onNotify={notify}
					messages={messages}
				/>
			) : (
				<RubricEditorNonCapstone
					rubric={rubric}
					rubricId={rubricId}
					canEdit={canEdit}
					queryKey={queryKey}
					onNotify={notify}
					messages={messages}
				/>
			)}

			<Toast
				isOpen={toastState.open}
				type={toastState.type}
				message={toastState.message}
				onClose={() => setToastState({ ...toastState, open: false })}
			/>
		</div>
	);
}
