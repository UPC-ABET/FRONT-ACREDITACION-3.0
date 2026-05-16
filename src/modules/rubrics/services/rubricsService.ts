/**
 * Rubrics Service
 *
 * CRUD para el módulo rubrics.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type ApiResponse<T> = {
    code: number
    message: string
    data: T
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) throw new Error(`[${res.status}] ${res.statusText} — ${url}`);
    return (res.json() as unknown) as T;
}

export const rubricsService = {
    /** Obtiene todas las rúbricas (sin paginación) */
    getAll(): Promise<ApiResponse<any[]>> {
        return request(`${BASE_URL}/rubrics/get-all`);
    },

    /** Obtiene lista paginada (si el backend soporta los querys genéricos) */
    getPaged(page = 1, limit = 20): Promise<ApiResponse<any>> {
        return request(`${BASE_URL}/rubrics?page=${page}&limit=${limit}`);
    },

    /** Obtiene un registro por id (ruta documentada) */
    getById(rubricId: string | number): Promise<ApiResponse<any>> {
        return request(`${BASE_URL}/rubrics/rubric/${rubricId}`);
    },

    /** Obtiene rúbrica por curso */
    getByCourse(courseId: string | number): Promise<ApiResponse<any>> {
        return request(`${BASE_URL}/rubrics/course/${courseId}`);
    },

    /** Crea solo la cabecera de la rúbrica */
    create(body: Record<string, unknown>): Promise<ApiResponse<any>> {
        return request(`${BASE_URL}/rubrics/create`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    /** Crea rúbrica completa (preguntas + criterios) */
    createFull(body: Record<string, unknown>): Promise<ApiResponse<any>> {
        return request(`${BASE_URL}/rubrics/create-full`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    /** Actualiza rúbrica por id */
    update(id: string | number, body: Record<string, unknown>): Promise<ApiResponse<any>> {
        return request(`${BASE_URL}/rubrics/update/${id}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    /** Elimina rúbrica (ruta documentada) */
    delete(id: string | number): Promise<ApiResponse<any>> {
        return request(`${BASE_URL}/rubrics/delete/${id}`, { method: 'DELETE' });
    },

    /** Buscar rúbricas por filtros */
    getByFilters(filters: Record<string, unknown>): Promise<ApiResponse<any[]>> {
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
