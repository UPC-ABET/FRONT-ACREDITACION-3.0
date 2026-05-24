import { useQuery } from '@tanstack/react-query'
import { typeGroupsService, typesService } from '@/modules/academic/services'

export function useQualificationStatusTypes() {
  const { data: typeGroups = [], isLoading: isLoadingGroup } = useQuery({
    queryKey: ['type-groups', 'TG404'],
    queryFn: () => typeGroupsService.getByFilters({ code: 'TG404' }).then((r) => r.data),
    staleTime: Infinity,
  })

  const typeGroupId = typeGroups[0]?.id ?? null

  const { data: statusTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['types', 'qualification-status', typeGroupId],
    queryFn: () =>
      typesService.getByFilters({ type_group_id: typeGroupId! }).then((r) => r.data),
    enabled: typeGroupId != null,
    staleTime: Infinity,
  })

  return {
    statusTypes,
    isLoading: isLoadingGroup || (typeGroupId != null && isLoadingTypes),
  }
}
