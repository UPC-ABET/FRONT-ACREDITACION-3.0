'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/api-error';
import { tryTranslate } from '@/shared/utils/try-translate';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
	isOpen: boolean;
	type: ToastType;
	message: string;
}

const AUTO_DISMISS_MS = 5_000;

export function useApiErrorToast(autoDismissMs = AUTO_DISMISS_MS) {
	const { t } = useI18n();
	const [toast, setToast] = useState<ToastState>({ isOpen: false, type: 'error', message: '' });
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const clearToast = useCallback(() => {
		setToast((prev) => ({ ...prev, isOpen: false }));
		if (timerRef.current) clearTimeout(timerRef.current);
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = 'error') => {
			const translated = tryTranslate(t, message);
			setToast({ isOpen: true, type, message: translated });

			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(clearToast, autoDismissMs);
		},
		[t, autoDismissMs, clearToast],
	);

	const handleError = useCallback(
		(error: unknown, fallbackKey = 'error.generic') => {
			showToast(getErrorMessage(error, fallbackKey), 'error');
		},
		[showToast],
	);

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		},
		[],
	);

	return { toast, showToast, handleError, clearToast } as const;
}
