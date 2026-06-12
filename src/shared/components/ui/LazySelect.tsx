'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import SelectBase, {
	type CSSObjectWithLabel,
	type InputActionMeta,
	type SingleValue,
} from 'react-select';
import { useI18n } from '@/providers';

export type LazyPageResult<T> = { items: T[]; totalPages: number };
export type LazySelectValue = { id: number; label: string };

interface LazyOption<T> {
	value: number;
	label: string;
	raw?: T;
}

interface LazySelectProps<T> {
	label?: string;
	placeholder?: string;
	/** Current selection (id + display label), or null. */
	value: LazySelectValue | null;
	onChange: (item: T | null) => void;
	/** Fetches one page for the given search term (1-based page). */
	loadPage: (params: { search: string; page: number }) => Promise<LazyPageResult<T>>;
	getId: (item: T) => number;
	getLabel: (item: T) => string;
	isDisabled?: boolean;
}

const selectStyles = {
	control: (base: CSSObjectWithLabel, state: { isFocused: boolean }) => ({
		...base,
		minHeight: 40,
		borderRadius: 6,
		borderColor: state.isFocused ? '#dc2626' : '#e4e4e7',
		boxShadow: 'none',
		fontSize: 14,
		':hover': { borderColor: state.isFocused ? '#dc2626' : '#d4d4d8' },
	}),
	menuPortal: (base: CSSObjectWithLabel) => ({ ...base, zIndex: 9999 }),
	option: (base: CSSObjectWithLabel, state: { isSelected: boolean; isFocused: boolean }) => ({
		...base,
		backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fee2e2' : 'white',
		color: state.isSelected ? 'white' : '#111827',
	}),
};

/**
 * Reusable async <select> backed by a paginated endpoint:
 *  - opens → fetch page 1
 *  - typing → debounced (~300ms) refetch page 1, replacing the list
 *  - scroll to bottom → fetch next page and append (while page < totalPages)
 *
 * It is decoupled from any specific service via `loadPage`/`getId`/`getLabel`.
 */
export function LazySelect<T>({
	label,
	placeholder,
	value,
	onChange,
	loadPage,
	getId,
	getLabel,
	isDisabled,
}: LazySelectProps<T>) {
	const { t } = useI18n();
	const [options, setOptions] = useState<LazyOption<T>[]>([]);
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [loading, setLoading] = useState(false);
	const [loadedOnce, setLoadedOnce] = useState(false);

	const searchRef = useRef('');
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Guards against out-of-order responses (a slow page-1 landing after a newer search).
	const requestIdRef = useRef(0);

	const fetchPage = useCallback(
		async (search: string, nextPage: number, append: boolean) => {
			const requestId = ++requestIdRef.current;
			setLoading(true);
			try {
				const result = await loadPage({ search, page: nextPage });
				if (requestId !== requestIdRef.current) return;
				const mapped = result.items.map((item) => ({
					value: getId(item),
					label: getLabel(item),
					raw: item,
				}));
				setOptions((prev) => (append ? [...prev, ...mapped] : mapped));
				setPage(nextPage);
				setTotalPages(result.totalPages);
			} catch {
				if (requestId === requestIdRef.current && !append) setOptions([]);
			} finally {
				if (requestId === requestIdRef.current) setLoading(false);
			}
		},
		[loadPage, getId, getLabel],
	);

	const handleMenuOpen = () => {
		if (!loadedOnce) {
			setLoadedOnce(true);
			void fetchPage(searchRef.current, 1, false);
		}
	};

	const handleInputChange = (input: string, meta: InputActionMeta) => {
		if (meta.action !== 'input-change') return;
		searchRef.current = input;
		setLoadedOnce(true);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			void fetchPage(input, 1, false);
		}, 300);
	};

	const handleScrollToBottom = () => {
		if (!loading && page < totalPages) {
			void fetchPage(searchRef.current, page + 1, true);
		}
	};

	const rsValue = value ? { value: value.id, label: value.label } : null;

	// Keep the current selection visible even before/without options loaded.
	const mergedOptions = useMemo<LazyOption<T>[]>(() => {
		const current = value ? { value: value.id, label: value.label } : null;
		if (current && !options.some((option) => option.value === current.value)) {
			return [current, ...options];
		}
		return options;
	}, [options, value]);

	return (
		<div className="flex w-full flex-col">
			{label && (
				<label className="mb-2 block text-base font-semibold text-zinc-900 select-none">
					{label}
				</label>
			)}
			<SelectBase<LazyOption<T>>
				value={rsValue}
				options={mergedOptions}
				isLoading={loading}
				isClearable
				isDisabled={isDisabled}
				placeholder={placeholder ?? t('select.placeholder.default')}
				filterOption={null}
				menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
				menuPosition="fixed"
				styles={selectStyles}
				onMenuOpen={handleMenuOpen}
				onMenuScrollToBottom={handleScrollToBottom}
				onInputChange={(input, meta) => {
					handleInputChange(input, meta);
					return input;
				}}
				onChange={(option: SingleValue<LazyOption<T>>) => onChange(option?.raw ?? null)}
				loadingMessage={() => t('loading.default')}
				noOptionsMessage={() => t('select.noOptions')}
			/>
		</div>
	);
}
