import { useQuery } from '@tanstack/react-query';
import { professorsService } from '../services';

export const professorsQueryKeys = {
	byUserId: (userId: string | number) => ['professors', 'by-user-id', userId] as const,
};

export function useProfessorByUserId(userId: string | number | undefined) {
	return useQuery({
		queryKey: professorsQueryKeys.byUserId(userId!),
		queryFn: () => professorsService.getByUserId(userId!).then((r) => r.data),
		enabled: userId != null,
	});
}
