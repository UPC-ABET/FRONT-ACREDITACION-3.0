'use client';

import { useI18n } from '@/providers';
import { Card } from '@/shared/components';
import { IFC_SHARED_LABELS } from './ifc.labels';
import type { I18nText } from '../../services/types';

type Props = { learningOutcome: I18nText };

export function IFCResultadoAlcanzado({ learningOutcome }: Props) {
	const { locale: lang } = useI18n();
	const text = learningOutcome?.[lang] ?? learningOutcome?.es ?? '';

	return (
		<Card title={IFC_SHARED_LABELS.resultado_alcanzado[lang]} className="h-full">
			<p className="whitespace-pre-line text-base leading-relaxed text-zinc-800">
				{text || '—'}
			</p>
		</Card>
	);
}
