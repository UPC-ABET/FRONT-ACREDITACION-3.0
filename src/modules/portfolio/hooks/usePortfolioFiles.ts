import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portfolioS3Service } from '../services';
import { portfolioQueryKeys } from './queryKeys';

export function usePortfolioFiles(prefix: string) {
	return useQuery({
		queryKey: portfolioQueryKeys.list(prefix),
		queryFn: () => portfolioS3Service.list(prefix),
		staleTime: 30_000,
	});
}

export function useCreateFolder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ prefix, name }: { prefix: string; name: string }) =>
			portfolioS3Service.createFolder(prefix, name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.all });
		},
	});
}

export function useDeleteEntries() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (keys: string[]) => portfolioS3Service.deleteEntries(keys),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.all });
		},
	});
}

/** Uploads files sequentially under the given prefix. Returns when all are done. */
export function useUploadFiles() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			prefix,
			files,
			onProgress,
		}: {
			prefix: string;
			files: File[];
			onProgress?: (done: number, total: number) => void;
		}) => {
			let done = 0;
			for (const file of files) {
				// Preserve folder structure when a directory is dropped.
				const relPath = ((file as File & { webkitRelativePath?: string }).webkitRelativePath ||
					file.name).replace(/^\/+/, '');
				await portfolioS3Service.uploadFile(`${prefix}${relPath}`, file);
				done += 1;
				onProgress?.(done, files.length);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.all });
		},
	});
}
