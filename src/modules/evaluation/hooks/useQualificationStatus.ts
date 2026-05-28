'use client';

import { useTypeGroups, useTypes } from '@/modules/core/hooks';

export function useQualificationStatusTypes() {
	const { data: typeGroups = [], isLoading: isLoadingGroup } = useTypeGroups({ code: 'TG404' });

	const typeGroupId = typeGroups[0]?.id ?? null;

	const { data: statusTypes = [], isLoading: isLoadingTypes } = useTypes(
		{ type_group_id: typeGroupId ?? undefined },
		{ enabled: typeGroupId != null },
	);

	return {
		statusTypes,
		isLoading: isLoadingGroup || (typeGroupId != null && isLoadingTypes),
	};
}
