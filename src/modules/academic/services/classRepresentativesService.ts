import { ApiResponse } from '@/shared';
import { apiGet, apiPut } from '@/shared/lib';
import type {
	ClassRepresentativeMaintenanceItem,
	AssignRepresentativeDto,
	ClassRepresentativeMaintenanceList,
} from '../types';

const REPRESENTATIVES_BASE = '/admin/academic/class-representatives';

export const classRepresentativesService = {
	/**
	 * Obtiene el listado de todos los delegados activos con cruce de información completo.
	 * Recuerda que el X-Academic-Period-Id viaja inyectado automáticamente en las cabeceras.
	 */
	getAll(): Promise<ApiResponse<ClassRepresentativeMaintenanceItem[]>> {
		return apiGet(`${REPRESENTATIVES_BASE}/get-all`);
	},

	/**
	 * Asigna a un alumno el rol de delegado de sección cruzando códigos de negocio.
	 */
	assign(body: AssignRepresentativeDto): Promise<ApiResponse<{ success: boolean }>> {
		return apiPut(`${REPRESENTATIVES_BASE}/assign`, body);
	},

	/**
	 * Remueve el estado de delegado de un alumno en una sección usando sus códigos de negocio.
	 */
	remove(body: AssignRepresentativeDto): Promise<ApiResponse<{ success: boolean }>> {
		return apiPut(`${REPRESENTATIVES_BASE}/remove`, body);
	},

	maintenance(params: {
		page: number;
		pageSize: number;
		search?: string;
	}): Promise<ApiResponse<ClassRepresentativeMaintenanceList>> {
		const query = new URLSearchParams();
		query.set('page', String(params.page));
		query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		return apiGet(`${REPRESENTATIVES_BASE}/maintenance?${query.toString()}`);
	},
};
