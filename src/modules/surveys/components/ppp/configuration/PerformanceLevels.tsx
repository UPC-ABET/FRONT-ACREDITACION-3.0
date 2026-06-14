'use client';

import React, { useEffect } from 'react';
import { Button, Input, Toast, LoadingState } from '@/shared/components';
import { useI18n } from '@/providers';
import type { PerformanceLevel } from '../../../types';
import { MIN_PERFORMANCE_LEVEL, MAX_PERFORMANCE_LEVEL } from '../../../constants/competence';

interface PerformanceLevelsProps {
	readonly cycleId: number;
	readonly levels: PerformanceLevel[];
	readonly setLevels: React.Dispatch<React.SetStateAction<PerformanceLevel[]>>;
	readonly loading: boolean;
	readonly error: string | null;
	readonly onLoad: (cycleId: number) => void;
	readonly onSave: (cycleId: number, levels: PerformanceLevel[], onSuccess?: () => void) => void;
}

const DEFAULT_LEVELS: PerformanceLevel[] = [
	{ level: 1, description: 'Insufficient', range: '0-40%' },
	{ level: 2, description: 'Fair', range: '41-60%' },
	{ level: 3, description: 'Good', range: '61-75%' },
	{ level: 4, description: 'Very Good', range: '76-90%' },
	{ level: 5, description: 'Excellent', range: '91-100%' },
];

export function PerformanceLevels({
	cycleId,
	levels,
	setLevels,
	loading,
	error,
	onLoad,
	onSave,
}: PerformanceLevelsProps) {
	const { t } = useI18n();
	const [saving, setSaving] = React.useState(false);
	const [toast, setToast] = React.useState<{
		open: boolean;
		type: 'success' | 'error';
		msg: string;
	}>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		if (cycleId) onLoad(cycleId);
	}, [cycleId, onLoad]);

	const displayLevels = levels.length > 0 ? levels : DEFAULT_LEVELS;

	function updateLevel(index: number, field: keyof PerformanceLevel, value: string) {
		setLevels((prev) => {
			const updated = [...(prev.length > 0 ? prev : DEFAULT_LEVELS)];
			updated[index] = { ...updated[index], [field]: value };
			return updated;
		});
	}

	function handleSave() {
		setSaving(true);
		onSave(cycleId, displayLevels, () => {
			setSaving(false);
			setToast({
				open: true,
				type: 'success',
				msg: t('surveys.performanceLevels.toast.saved'),
			});
		});
	}

	if (loading) {
		return <LoadingState className="h-32" label={t('surveys.performanceLevels.loading')} />;
	}

	return (
		<div className="space-y-4">
			<div>
				<h4 className="text-sm font-bold text-zinc-700">{t('surveys.performanceLevels.title')}</h4>
				<p className="text-xs text-zinc-500 mt-1">
					{t('surveys.performanceLevels.description')
						.replace('{{min}}', String(MIN_PERFORMANCE_LEVEL))
						.replace('{{max}}', String(MAX_PERFORMANCE_LEVEL))}
				</p>
			</div>

			{error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

			<div className="space-y-3">
				{displayLevels.map((level, idx) => (
					<div
						key={level.level}
						className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
						<span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-white text-sm font-bold shrink-0">
							{level.level}
						</span>
						<div className="flex-1 grid grid-cols-2 gap-3">
							<Input
								placeholder={t('surveys.performanceLevels.descriptionPlaceholder')}
								value={level.description}
								onChange={(e) => updateLevel(idx, 'description', e.target.value)}
							/>
							<Input
								placeholder={t('surveys.performanceLevels.rangePlaceholder')}
								value={level.range}
								onChange={(e) => updateLevel(idx, 'range', e.target.value)}
							/>
						</div>
					</div>
				))}
			</div>

			<Button onClick={handleSave} disabled={saving} loading={saving}>
				{t('surveys.performanceLevels.save')}
			</Button>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
