import type { I18nText } from './i18n';

export type SchoolSourceItem = { id: number; code: string; name: I18nText };

export type SchoolSource = {
	key: string;
	fetch: () => Promise<SchoolSourceItem[]>;
};
