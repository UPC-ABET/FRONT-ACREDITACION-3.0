import { useMutation, useQuery } from '@tanstack/react-query';
import {
	getCapstoneRubric,
	listCapstoneProjects,
	submitCapstoneEvaluation,
} from '../services/capstoneService';
import type {
	CapstoneProject,
	CapstoneRubric,
	SubmitCapstoneEvaluationPayload,
} from '../types/capstone';

export function useCapstoneProjects(professorId: number | null) {
	return useQuery<CapstoneProject[], Error>({
		queryKey: ['capstone', 'projects', professorId],
		queryFn: () => listCapstoneProjects(professorId as number),
		enabled: professorId !== null,
	});
}

export function useCapstoneRubric(projectId: number | null) {
	return useQuery<CapstoneRubric, Error>({
		queryKey: ['capstone', 'rubric', projectId],
		queryFn: () => getCapstoneRubric(projectId as number),
		enabled: projectId !== null,
	});
}

export function useSubmitCapstoneEvaluation() {
	return useMutation<{ id: number }, Error, SubmitCapstoneEvaluationPayload>({
		mutationFn: submitCapstoneEvaluation,
	});
}
