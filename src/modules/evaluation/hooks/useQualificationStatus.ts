'use client';

import { useTypeGroups, useTypes } from '@/modules/core/hooks';
import { TYPE_GROUP_CODES } from '@/shared/constants';

export function useQualificationStatusTypes() {
	const { data: typeGroups = [], isLoading: isLoadingGroup } = useTypeGroups({
		code: TYPE_GROUP_CODES.QUALIFICATION_STATUS,
	});

	const typeGroupId = typeGroups[0]?.id ?? null;

	const { data: statusTypes = [], isLoading: isLoadingTypes } = useTypes(
		{ typeGroupId: typeGroupId ?? undefined },
		{ enabled: typeGroupId != null },
	);

	return {
		statusTypes,
		isLoading: isLoadingGroup || (typeGroupId != null && isLoadingTypes),
	};
}
