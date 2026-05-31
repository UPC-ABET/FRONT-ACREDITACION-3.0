import { apiGet, apiPost } from '@/shared/lib/apiClient';
import type {
	CapstoneProject,
	CapstoneRubric,
	SubmitCapstoneEvaluationPayload,
} from '../types/capstone';

// Endpoints expected on the backend once the Capstone evaluation module is implemented.
const BASE = '/capstone';

export function listCapstoneProjects(professorId: number): Promise<CapstoneProject[]> {
	return apiGet<CapstoneProject[]>(`${BASE}/projects?professor_id=${professorId}`);
}

export function getCapstoneRubric(projectId: number): Promise<CapstoneRubric> {
	return apiGet<CapstoneRubric>(`${BASE}/projects/${projectId}/rubric`);
}

export function submitCapstoneEvaluation(
	payload: SubmitCapstoneEvaluationPayload,
): Promise<{ id: number }> {
	return apiPost<{ id: number }>(`${BASE}/evaluations`, payload);
}
