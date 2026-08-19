import { TYPE_CODES, TYPE_GROUP_CODES } from '@/shared/constants';

export const ENTITY_TYPE = TYPE_CODES.CHART_ENTITY_TYPE;
export const ENTITY_TYPE_GROUP_CODE = TYPE_GROUP_CODES.ORG_CHART_ENTITY_TYPE;

export const READ_ONLY_ENTITY_TYPE_CODES: readonly string[] = [
	ENTITY_TYPE.DEAN,
	ENTITY_TYPE.SCHOOL,
	ENTITY_TYPE.PROGRAM,
];

export const ENTITY_TYPE_CODES_NEEDING_CODE: readonly string[] = [
	ENTITY_TYPE.SCHOOL,
	ENTITY_TYPE.PROGRAM,
	ENTITY_TYPE.COURSE,
];

export function isReadOnlyEntityType(code: string | undefined | null): boolean {
	return code != null && READ_ONLY_ENTITY_TYPE_CODES.includes(code);
}

export function entityTypeNeedsCode(code: string | undefined | null): boolean {
	return code != null && ENTITY_TYPE_CODES_NEEDING_CODE.includes(code);
}

export const NODE_ACCENT_BY_CODE: Record<string, string> = {
	[ENTITY_TYPE.DEAN]: '#dc2626',
	[ENTITY_TYPE.SCHOOL]: '#2563eb',
	[ENTITY_TYPE.PROGRAM]: '#7c3aed',
	[ENTITY_TYPE.AREA]: '#0891b2',
	[ENTITY_TYPE.SUBAREA]: '#0d9488',
	[ENTITY_TYPE.COURSE]: '#ca8a04',
};

export const DEFAULT_NODE_ACCENT = '#71717a';

export function accentForEntityType(code: string | undefined | null): string {
	return (code && NODE_ACCENT_BY_CODE[code]) || DEFAULT_NODE_ACCENT;
}

export const NODE_WIDTH = 268;
export const NODE_HEIGHT = 122;
export const NODE_HORIZONTAL_GAP = 28;
export const NODE_VERTICAL_GAP = 60;
export const STACK_INDENT = 32;
export const STACK_VERTICAL_GAP = 18;
export const CANVAS_PADDING = 36;

export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 1.6;
export const ZOOM_STEP = 0.15;
