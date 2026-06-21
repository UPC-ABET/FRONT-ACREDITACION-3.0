'use client';

import React from 'react';
import { Button } from '@/shared/components';
import { useI18n } from '@/providers';

interface LCFCDeadlineFieldProps {
	readonly deadlineDate: string;
	readonly savingDeadline: boolean;
	readonly onDeadlineDateChange: (value: string) => void;
	readonly onSave: () => void;
}

export function LCFCDeadlineField({
	deadlineDate,
	savingDeadline,
	onDeadlineDateChange,
	onSave,
}: LCFCDeadlineFieldProps) {
	const { t } = useI18n();

	return (
		// Survey deadline — configured here (not in notifications). Updating it refreshes
		// existing surveys' deadline without resending any email.
		<div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 p-4">
			<div>
				<label className="font-medium text-xs mb-1.5 text-zinc-700 block">
					{t('surveys.lcfc.config.deadlineLabel')}
					<span className="ml-1 text-red-600">*</span>
				</label>
				<input
					type="date"
					value={deadlineDate}
					onChange={(e) => onDeadlineDateChange(e.target.value)}
					className="h-9 rounded-md border border-zinc-200 px-3 text-sm focus:outline-none focus:border-red-500"
				/>
			</div>
			<Button
				size="sm"
				onClick={onSave}
				disabled={!deadlineDate || savingDeadline}
				loading={savingDeadline}>
				{t('surveys.lcfc.config.deadlineSave')}
			</Button>
			<p className="text-xs text-zinc-500 basis-full">{t('surveys.lcfc.config.deadlineHint')}</p>
		</div>
	);
}
