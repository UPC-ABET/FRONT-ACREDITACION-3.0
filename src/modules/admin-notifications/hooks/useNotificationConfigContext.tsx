'use client';

import { createContext, useContext } from 'react';
import type { CoreType, NotifyVar } from '../types';

interface NotificationConfigContextValue {
	periodId: number;
	chartLevels: CoreType[];
	notifyVars: NotifyVar[];
	onSaved: () => void;
	onError: (msg: string) => void;
	onSuccess: (msg: string) => void;
}

const NotificationConfigContext = createContext<NotificationConfigContextValue | null>(null);

export function NotificationConfigProvider({
	children,
	...value
}: NotificationConfigContextValue & { children: React.ReactNode }) {
	return (
		<NotificationConfigContext.Provider value={value}>
			{children}
		</NotificationConfigContext.Provider>
	);
}

export function useNotificationConfigContext(): NotificationConfigContextValue {
	const ctx = useContext(NotificationConfigContext);
	if (!ctx) throw new Error('useNotificationConfigContext must be used within NotificationConfigProvider');
	return ctx;
}
