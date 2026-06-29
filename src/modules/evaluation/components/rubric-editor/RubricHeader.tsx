'use client';

import { useI18n } from '@/providers';
import { Badge, PageHeader, SubTitle } from '@/shared/components/ui';
import { RubricDetail } from '@/modules';

interface RubricHeaderProps {
	rubric: RubricDetail;
}

export function RubricHeader({ rubric }: RubricHeaderProps) {
	const { t, locale } = useI18n();

	return (
		<div className="flex flex-col gap-5">
			<div className="space-y-1">
				<PageHeader title={rubric.gradeType[locale]} description={rubric.course.name[locale]} />

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
	);
}
