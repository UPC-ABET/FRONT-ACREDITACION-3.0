export type SelectOption = { label: string; value: number };
export type AnyOption = { label: string; value: string | number };

export function toSelectOption(opt: AnyOption | AnyOption[] | null): SelectOption | null {
	const single = Array.isArray(opt) ? (opt[0] ?? null) : opt;
	return single ? { label: single.label, value: Number(single.value) } : null;
}
