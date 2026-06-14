import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portfolioS3Service } from '../services';
import { portfolioQueryKeys } from './queryKeys';

function useInvalidateAll() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.all });
}

export function useRenameEntry() {
	const invalidate = useInvalidateAll();
	return useMutation({
		mutationFn: ({ key, newName }: { key: string; newName: string }) =>
			portfolioS3Service.rename(key, newName),
		onSuccess: invalidate,
	});
}

export function useCopyEntries() {
	const invalidate = useInvalidateAll();
	return useMutation({
		mutationFn: ({ keys, destPrefix }: { keys: string[]; destPrefix: string }) =>
			portfolioS3Service.copy(keys, destPrefix),
		onSuccess: invalidate,
	});
}

export function useMoveEntries() {
	const invalidate = useInvalidateAll();
	return useMutation({
		mutationFn: ({ keys, destPrefix }: { keys: string[]; destPrefix: string }) =>
			portfolioS3Service.move(keys, destPrefix),
		onSuccess: invalidate,
	});
}

export function useCreateTextFile() {
	const invalidate = useInvalidateAll();
	return useMutation({
		mutationFn: ({ prefix, name }: { prefix: string; name: string }) =>
			portfolioS3Service.createTextFile(prefix, name),
		onSuccess: invalidate,
	});
}

/** Loads every object key under a prefix for the tree view (lazily, when enabled). */
export function usePortfolioTreeKeys(prefix: string, enabled: boolean) {
	return useQuery({
		queryKey: portfolioQueryKeys.tree(prefix),
		queryFn: () => portfolioS3Service.listAllKeys(prefix),
		enabled,
		staleTime: 30_000,
	});
}
