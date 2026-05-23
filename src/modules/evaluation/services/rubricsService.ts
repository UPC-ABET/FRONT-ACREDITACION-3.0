/**
 * Rubrics Service
 *
 * CRUD para el módulo rubrics.
 */

import { ApiResponse } from '@/shared';
import { buildJsonHeaders } from '@/shared/lib'
import type { CreateRubricDto, CreateRubricFullDto, FilterRubricDto, UpdateRubricDto } from '../api/dtos/request'
import { GetRubricByIdResponse, RubricResponse } from '../api/dtos';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: buildJsonHeaders(options?.headers),
    });
    if (!res.ok) throw new Error(`[${res.status}] ${res.statusText} — ${url}`);
    return (res.json() as unknown) as T;
}

export const rubricsService = {
    /** Obtiene todas las rúbricas (sin paginación) */
    getAll(): Promise<ApiResponse<RubricResponse[]>> {
        return request(`${BASE_URL}/rubrics/get-all`);
    },

    /** Obtiene lista paginada (si el backend soporta los querys genéricos) */
    getPaged(page = 1, limit = 20): Promise<ApiResponse<RubricResponse[]>> {
        return request(`${BASE_URL}/rubrics?page=${page}&limit=${limit}`);
    },

    /** Obtiene un registro por id (ruta documentada) */
    getById(rubricId: string | number): Promise<ApiResponse<GetRubricByIdResponse>> {
        return request(`${BASE_URL}/rubrics/get-by-id/${rubricId}`);
    },

    /** Obtiene rúbrica por curso */
    getByCourse(courseId: string | number): Promise<ApiResponse<RubricResponse | RubricResponse[]>> {
        return request(`${BASE_URL}/rubrics/course/${courseId}`);
    },

    /** Crea solo la cabecera de la rúbrica */
    create(body: CreateRubricDto): Promise<ApiResponse<RubricResponse>> {
        return request(`${BASE_URL}/rubrics/create`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    /** Crea rúbrica completa (preguntas + criterios) */
    createFull(body: CreateRubricFullDto): Promise<ApiResponse<RubricResponse>> {
        return request(`${BASE_URL}/rubrics/create-full`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    /** Actualiza rúbrica por id */
    update(id: string | number, body: UpdateRubricDto): Promise<ApiResponse<RubricResponse>> {
        return request(`${BASE_URL}/rubrics/update/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },

    /** Elimina rúbrica (ruta documentada) */
    delete(id: string | number): Promise<ApiResponse<RubricResponse>> {
        return request(`${BASE_URL}/rubrics/delete/${id}`, { method: 'DELETE' });
    },

    /** Buscar rúbricas por filtros */
    getByFilters(filters: FilterRubricDto): Promise<ApiResponse<RubricResponse[]>> {
        return request(`${BASE_URL}/rubrics/get-by-filters`, {
            method: 'POST',
            body: JSON.stringify(filters),
        });
    },

    /** Recalcular nota máxima (si el backend expone la ruta) */
    getMaxScore(rubricId: string | number): Promise<ApiResponse<any>> {
        return request(`${BASE_URL}/rubrics/${rubricId}/max-score`);
    },
};
