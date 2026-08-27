'use client';

import { useTypesByGroupCode } from '@/modules/core';
import { useABET, useI18n } from '@/providers';
import { TYPE_GROUP_CODES } from '@/shared/constants';

/** Display name of the study modality currently selected in the top bar. */
export function useModalityLabel(): string | undefined {
	const { locale } = useI18n();
	const { modalityTypeId } = useABET();
	const { data: modalities = [] } = useTypesByGroupCode(TYPE_GROUP_CODES.PROGRAM_MODALITY);

	const modality = modalities.find((option) => option.id === modalityTypeId);
	if (!modality) return undefined;
	return modality.name[locale] ?? modality.name.es ?? modality.code;
}
