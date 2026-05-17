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
		<Card title={IFC_SHARED_LABELS.resultado_alcanzado[lang]}>
			<p className="text-sm text-zinc-700 whitespace-pre-line">{text || '—'}</p>
		</Card>
	);
}
