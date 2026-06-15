'use client';

import { useI18n } from '@/providers';
import { SubTitle, Title } from '@/shared/components';
import type { I18nText } from '@/shared';

type Props = {
	area: I18nText;
	subarea: I18nText;
	course: I18nText;
	period: string;
};

export function IFCPageTitle({ area, subarea, course, period }: Props) {
	const { locale: lang } = useI18n();
	const courseName = course?.[lang] ?? '';
	const crumbs = [area?.[lang] ?? '', subarea?.[lang] ?? '', period].filter(Boolean);

	return (
		<div className="space-y-1.5">
			<p className="text-sm font-semibold uppercase tracking-wider text-red-700">IFC</p>
			<Title
				title={courseName || '-'}
				className="[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-zinc-900 sm:[&_h2]:text-3xl"
			/>
			{crumbs.length > 0 && (
				<SubTitle
					name={crumbs.join(' - ')}
					className="[&_h3]:text-base [&_h3]:font-normal [&_h3]:text-zinc-600"
				/>
			)}
		</div>
	);
}
