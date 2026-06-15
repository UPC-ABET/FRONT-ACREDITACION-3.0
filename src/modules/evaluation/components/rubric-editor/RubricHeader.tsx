'use client';

import { useI18n } from '@/providers';
import { Badge, SubTitle, Title } from '@/shared/components/ui';
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
					<Title
						title={rubric.gradeType[locale]}
						className="[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-zinc-900"
					/>

					<SubTitle
						name={rubric.course.name[locale]}
						className="[&_h3]:text-base [&_h3]:font-medium [&_h3]:text-zinc-700"
					/>

					<SubTitle
						name={rubric.program.name[locale]}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
					/>
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
