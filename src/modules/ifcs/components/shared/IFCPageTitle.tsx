'use client';

import { useI18n } from '@/providers';
import type { I18nText } from '../../services/types';

type Props = {
	area: I18nText;
	subarea: I18nText;
	course: I18nText;
	period: string;
};

export function IFCPageTitle({ area, subarea, course, period }: Props) {
	const { locale: lang } = useI18n();
	const title = ['IFC', area?.[lang] ?? '', subarea?.[lang] ?? '', course?.[lang] ?? '', period]
		.filter(Boolean)
		.join(' - ')
		.toUpperCase();
	return <h1 className="text-xl font-semibold tracking-wide text-zinc-800">{title}</h1>;
}
