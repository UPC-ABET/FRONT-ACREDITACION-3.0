'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Toggle } from '@/shared';
import { useI18n } from '@/providers';

interface DuplicateGradesToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}

export function DuplicateGradesToggle({ checked, onChange, disabled }: DuplicateGradesToggleProps) {
	const { t } = useI18n();

	return (
		<div className="flex items-center justify-end gap-2 border-b border-zinc-200 px-4 py-3">
			<span className="text-xs text-zinc-500">{t('projects.evaluate.rubric.duplicateGrades')}</span>
			<Toggle checked={checked} onChange={onChange} disabled={disabled} />
			<span title={t('projects.evaluate.rubric.duplicateGradesInfo')}>
				<InformationCircleIcon className="h-4 w-4 cursor-help text-zinc-400" />
			</span>
		</div>
	);
}
