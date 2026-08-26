'use client';

import { useState } from 'react';

/**
 * Fires `onChange` during render whenever `key` changes (compared with `!==`), starting
 * from `initial`. `key` must be a primitive/stable-by-value type — an object or array
 * literal recreated each render will never equal its previous value and fires on every
 * render. `initial` must be a value `key` can never legitimately equal on first render;
 * if it can, `onChange` silently won't fire on mount.
 */
export function useSyncOnChange<T>(key: T, initial: T, onChange: (key: T) => void): void {
	const [syncedKey, setSyncedKey] = useState<T>(initial);
	if (key !== syncedKey) {
		setSyncedKey(key);
		onChange(key);
	}
}
