import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classRepresentativesService } from '../services/classRepresentativesService';
import { academicQueryKeys } from './queryKeys'; // Cambiado al nombre exacto de tu archivo
import { AssignRepresentativeDto } from '../types';
import { useABET } from '@/providers';

export const useClassRepresentativesMaintenance = () => {
	const queryClient = useQueryClient();
	const { academicPeriodId } = useABET();

	// 1. Query usando el endpoint de maintenance filtrado por periodo académico
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: [...academicQueryKeys.classRepresentatives(), { academicPeriodId }],
		queryFn: async () => {
			const response = await classRepresentativesService.maintenance({
				page: 1,
				pageSize: 1000,
			});
			return response.data.items;
		},
		enabled: academicPeriodId != null,
	});

	const representatives = data ?? [];

	// 2. Mutación para Asignar Delegado
	const assignMutation = useMutation({
		mutationFn: (dto: AssignRepresentativeDto) => classRepresentativesService.assign(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: academicQueryKeys.classRepresentatives() });
		},
	});

	// 3. Mutación para Remover Delegado
	const removeMutation = useMutation({
		mutationFn: (dto: AssignRepresentativeDto) => classRepresentativesService.remove(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: academicQueryKeys.classRepresentatives() });
		},
	});

	return {
		representatives,
		isLoading,
		isError,
		refetch,
		assignRepresentative: assignMutation.mutateAsync,
		isAssigning: assignMutation.isPending,
		removeRepresentative: removeMutation.mutateAsync,
		isRemoving: removeMutation.isPending,
	};
};
