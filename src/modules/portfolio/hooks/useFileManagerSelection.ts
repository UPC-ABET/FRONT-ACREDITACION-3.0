'use client';

import { useState } from 'react';

export function useFileManagerSelection() {
	const [prefix, setPrefix] = useState('');
	const [search, setSearch] = useState('');
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

	function clearSelection() {
		setSelectedKeys(new Set());
	}

	function navigateTo(nextPrefix: string) {
		setPrefix(nextPrefix);
		setSearch('');
		clearSelection();
	}

	function toggleSelect(key: string) {
		setSelectedKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}

	return {
		prefix,
		search,
		setSearch,
		selectedKeys,
		setSelectedKeys,
		clearSelection,
		navigateTo,
		toggleSelect,
	};
}
