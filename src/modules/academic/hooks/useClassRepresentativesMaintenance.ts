import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classRepresentativesService } from '../services/classRepresentativesService';
import { academicQueryKeys } from './queryKeys'; // Cambiado al nombre exacto de tu archivo
import { AssignRepresentativeDto } from '../types';

export const useClassRepresentativesMaintenance = () => {
    const queryClient = useQueryClient();

    // 1. Query para obtener todos los delegados
    const {
        data: representatives = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: academicQueryKeys.classRepresentatives(), // Usado como función con la estructura correcta
        queryFn: async () => {
            const response = await classRepresentativesService.getAll();
            return response.data;
        },
    });

    // 2. Mutación para Asignar Delegado
    const assignMutation = useMutation({
        mutationFn: (dto: AssignRepresentativeDto) => 
            classRepresentativesService.assign(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: academicQueryKeys.classRepresentatives() });
        },
    });

    // 3. Mutación para Remover Delegado
    const removeMutation = useMutation({
        mutationFn: (dto: AssignRepresentativeDto) => 
            classRepresentativesService.remove(dto),
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