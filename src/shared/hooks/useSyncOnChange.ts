'use client';

import { useState } from 'react';

export function useSyncOnChange<T>(key: T, initial: T, onChange: (key: T) => void): void {
	const [syncedKey, setSyncedKey] = useState<T>(initial);
	if (key !== syncedKey) {
		setSyncedKey(key);
		onChange(key);
	}
}
