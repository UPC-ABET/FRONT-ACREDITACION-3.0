/**
 * Rubrics Service
 *
 * CRUD para el módulo rubrics.
 */

import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib';
import type {
	CreateRubricDto,
	CreateRubricFullDto,
	FilterRubricDto,
	UpdateRubricDto,
	GetRubricByIdResponse,
	RubricResponse,
} from './types';

export const rubricsService = {
	/** Obtiene todas las rúbricas (sin paginación) */
	getAll(): Promise<ApiResponse<RubricResponse[]>> {
		return apiGet('/rubrics/get-all');
	},

	/** Obtiene lista paginada (si el backend soporta los querys genéricos) */
	getPaged(page = 1, limit = 20): Promise<ApiResponse<RubricResponse[]>> {
		return apiGet(`/rubrics?page=${page}&limit=${limit}`);
	},

	/** Obtiene un registro por id (ruta documentada) */
	getById(rubricId: string | number): Promise<ApiResponse<GetRubricByIdResponse>> {
		return apiGet(`/rubrics/get-by-id/${rubricId}`);
	},

	/** Obtiene rúbrica por curso */
	getByCourse(courseId: string | number): Promise<ApiResponse<RubricResponse | RubricResponse[]>> {
		return apiGet(`/rubrics/course/${courseId}`);
	},

	/** Crea solo la cabecera de la rúbrica */
	create(body: CreateRubricDto): Promise<ApiResponse<RubricResponse>> {
		return apiPost('/rubrics/create', body);
	},

	/** Crea rúbrica completa (preguntas + criterios) */
	createFull(body: CreateRubricFullDto): Promise<ApiResponse<RubricResponse>> {
		return apiPost('/rubrics/create-full', body);
	},

	/** Actualiza rúbrica por id */
	update(id: string | number, body: UpdateRubricDto): Promise<ApiResponse<RubricResponse>> {
		return apiPatch(`/rubrics/update/${id}`, body);
	},

	/** Elimina rúbrica (ruta documentada) */
	delete(id: string | number): Promise<ApiResponse<RubricResponse>> {
		return apiDelete(`/rubrics/delete/${id}`);
	},

	/** Buscar rúbricas por filtros */
	getByFilters(filters: FilterRubricDto): Promise<ApiResponse<RubricResponse[]>> {
		return apiPost('/rubrics/get-by-filters', filters);
	},

	/** Recalcular nota máxima (si el backend expone la ruta) */
	getMaxScore(rubricId: string | number): Promise<ApiResponse<any>> {
		return apiGet(`/rubrics/${rubricId}/max-score`);
	},
};
