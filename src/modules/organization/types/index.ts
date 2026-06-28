import type { I18nText } from '@/shared/types';

export interface ScopeTag {
	code: string;
	name: I18nText;
}

export interface ScopeOption {
	id: number;
	entityId: number;
	label: I18nText;
	parentId: number | null;
	tag: ScopeTag | null;
}

export interface ScopeLevel {
	levelNum: number;
	options: ScopeOption[];
}

export interface ScopeTree {
	highestLevel: number | null;
	canNotify: boolean;
	levels: ScopeLevel[];
}

export type SelectionValue = number | 'ALL' | null;
