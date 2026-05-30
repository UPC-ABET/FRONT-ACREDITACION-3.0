import { apiGet } from '@/shared/lib';
import { logger } from '@/shared/lib/logger';
import type { AcademicPeriod, Program } from '../types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

interface BackendEntity {
	id: number;
	code?: string;
	codigo?: string;
	name?: string | { es?: string; en?: string };
	nombre?: string;
	isActive?: boolean;
}

type Envelope<T> = T[] | { data?: T[] };

function unwrapList<T>(res: Envelope<T>): T[] {
	return Array.isArray(res) ? res : (res.data ?? []);
}

function adaptDisplayName(raw: BackendEntity): string {
	return (
		raw.nombre ??
		(typeof raw.name === 'string' ? raw.name : raw.name?.es) ??
		raw.code ??
		raw.codigo ??
		String(raw.id)
	);
}

// ─── Academic Periods ─────────────────────────────────────────────────────────

export async function getAcademicPeriods(): Promise<AcademicPeriod[]> {
	try {
		const res = await apiGet<Envelope<BackendEntity>>('academic-periods/get-all');
		return unwrapList(res).map((raw) => ({
			id: raw.id,
			nombre: adaptDisplayName(raw),
			codigo: raw.code ?? raw.codigo,
		}));
	} catch {
		return [];
	}
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<Program[]> {
	try {
		const res = await apiGet<Envelope<BackendEntity>>('programs/get-all');
		return unwrapList(res).map((raw) => ({
			id: raw.id,
			nombre: adaptDisplayName(raw),
			codigo: raw.code ?? raw.codigo,
		}));
	} catch {
		return [];
	}
}

// ─── Survey Type IDs (cached from /types/by-group-code/TG601) ────────────────
// The acceptance-levels endpoint requires surveyTypeId (numeric FK to types table).

let _surveyTypeIds: Map<string, number> | null = null;

function extractTypesList(raw: unknown): Array<{ id: number; code: string }> {
	if (Array.isArray(raw)) return raw as Array<{ id: number; code: string }>;
	if (raw && typeof raw === 'object') {
		const obj = raw as Record<string, unknown>;
		// try common envelope shapes: .data, .data.items, .items, .types, .result
		const inner = obj.data ?? obj.items ?? obj.types ?? obj.result;
		if (Array.isArray(inner)) return inner as Array<{ id: number; code: string }>;
		if (inner && typeof inner === 'object') {
			const nested = inner as Record<string, unknown>;
			const deep = nested.items ?? nested.types ?? nested.data;
			if (Array.isArray(deep)) return deep as Array<{ id: number; code: string }>;
		}
	}
	return [];
}

export async function getSurveyTypeId(code: string): Promise<number> {
	if (!_surveyTypeIds) {
		try {
			const res = await apiGet('types/by-group-code/TG601');
			const list = extractTypesList(res);
			const map = new Map<string, number>();
			for (const item of list) {
				if (item && typeof item === 'object') {
					const t = item as Record<string, unknown>;
					const id = typeof t.id === 'number' ? t.id : Number(t.id);
					// accept any field that looks like a code: code, typeCode, surveyTypeCode, codigo
					const rawCode = String(
						t.code ?? t.typeCode ?? t.surveyTypeCode ?? t.codigo ?? '',
					).toUpperCase();
					if (id > 0 && rawCode) map.set(rawCode, id);
				}
			}
			if (map.size > 0) {
				_surveyTypeIds = map;
			} else {
				logger.warn('[getSurveyTypeId] types/by-group-code/TG601 returned no usable items:', res);
			}
		} catch (err) {
			logger.warn('[getSurveyTypeId] failed to fetch survey type catalog:', err);
			// don't set _surveyTypeIds — allow retry on next call
		}
	}
	const id = _surveyTypeIds?.get(code.toUpperCase()) ?? 0;
	if (id === 0 && _surveyTypeIds && _surveyTypeIds.size > 0) {
		logger.warn(`[getSurveyTypeId] code "${code}" not found in catalog. Available keys:`, [
			..._surveyTypeIds.keys(),
		]);
	}
	return id;
}
