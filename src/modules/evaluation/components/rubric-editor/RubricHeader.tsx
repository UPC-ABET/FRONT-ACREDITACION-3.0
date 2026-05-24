'use client';

import { useI18n } from '@/providers';
import { Badge } from '@/shared/components/ui';
import { RubricDetail } from '../../types';

interface RubricHeaderProps {
	rubric: RubricDetail;
}

export function RubricHeader({ rubric }: RubricHeaderProps) {
	const { t, locale } = useI18n();

	return (
		<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-5">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight text-zinc-900">
						{rubric.gradeType[locale]}
					</h1>

					<p className="text-base font-medium text-zinc-700">{rubric.course.name[locale]}</p>

					<p className="text-sm text-zinc-500">{rubric.program.name[locale]}</p>
				</div>

				<div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
					<span>
						{t('rubrics.editor.header.academicPeriod')}: {rubric.academicPeriod.code}
					</span>

					<span className="text-zinc-300">|</span>

					<span>
						{t('rubrics.editor.header.maxScore')}: {rubric.maxScore.toFixed(1)}{' '}
						{t('rubrics.editor.header.units.points')}
					</span>

					<span className="text-zinc-300">|</span>

					{rubric.canEdit ? (
						<Badge variant="success">{t('rubrics.editor.header.editable')}</Badge>
					) : (
						<Badge variant="danger">{t('rubrics.editor.header.readonly')}</Badge>
					)}
				</div>
			</div>
		</div>
	);
}
