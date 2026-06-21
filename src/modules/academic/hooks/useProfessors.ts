import { useQuery } from '@tanstack/react-query';
import { professorsService } from '../services';

interface ProfessorFilters {
	search?: string;
	isActive?: boolean;
	unassigned?: boolean;
}

export const professorsQueryKeys = {
	byUserId: (userId: string | number) => ['professors', 'by-user-id', userId] as const,
	byFilters: (filters: ProfessorFilters) => ['professors', 'by-filters', filters] as const,
};

export function useProfessorByUserId(userId: string | number | undefined) {
	return useQuery({
		queryKey: professorsQueryKeys.byUserId(userId!),
		queryFn: () => professorsService.getByUserId(userId!).then((r) => r.data),
		enabled: userId != null,
	});
}

export function useProfessorsByFilters(filters: ProfessorFilters, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: professorsQueryKeys.byFilters(filters),
		queryFn: () => professorsService.getByFilters(filters).then((r) => r.data ?? []),
		enabled: options?.enabled ?? true,
	});
}
