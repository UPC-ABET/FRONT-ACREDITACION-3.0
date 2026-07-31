'use client';

import { useI18n } from '@/providers';
import { Card } from '@/shared/components';
import type { I18nText } from '../../types';

type Props = { learningOutcome: I18nText };

export function IFCLearningOutcomeReached({ learningOutcome }: Props) {
	const { t, locale: lang } = useI18n();
	const text = learningOutcome?.[lang] ?? learningOutcome?.es ?? '';

	return (
		<Card title={t('ifcs.shared.achievedOutcome')} className="h-full">
			<p className="whitespace-pre-line text-base leading-relaxed text-zinc-800">{text || '—'}</p>
		</Card>
	);
}
