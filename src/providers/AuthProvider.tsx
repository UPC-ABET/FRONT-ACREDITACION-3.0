'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/shared/lib';

export type AuthUser = {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
};

export type AuthRole = {
	id: number;
	code: string;
	name: string;
};

type AuthState = {
	user: AuthUser | null;
	activeRole: AuthRole | null;
	permissions: string[];
	schoolId: number | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	refreshUser: () => Promise<AuthUser | null>;
	clearUser: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

interface MePayload {
	user: AuthUser;
	activeRole: AuthRole;
	allowedRoles: AuthRole[];
	permissions: string[];
	schoolId: number;
}

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [activeRole, setActiveRole] = useState<AuthRole | null>(null);
	const [permissions, setPermissions] = useState<string[]>([]);
	const [schoolId, setSchoolId] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchUser = useCallback(async (): Promise<AuthUser | null> => {
		try {
			const envelope = await apiGet<Envelope<MePayload>>('/users/me');
			const payload = envelope?.data;
			if (!payload?.user) {
				setUser(null);
				return null;
			}
			setUser(payload.user);
			setActiveRole(payload.activeRole ?? null);
			setPermissions(payload.permissions ?? []);
			setSchoolId(payload.schoolId ?? null);
			return payload.user;
		} catch {
			setUser(null);
			setActiveRole(null);
			setPermissions([]);
			setSchoolId(null);
			return null;
		}
	}, []);

	const refreshUser = useCallback(async () => {
		setIsLoading(true);
		const u = await fetchUser();
		setIsLoading(false);
		return u;
	}, [fetchUser]);

	const clearUser = useCallback(() => {
		setUser(null);
		setActiveRole(null);
		setPermissions([]);
		setSchoolId(null);
	}, []);

	useEffect(() => {
		fetchUser().finally(() => setIsLoading(false));
	}, [fetchUser]);

	const value = useMemo<AuthState>(
		() => ({
			user,
			activeRole,
			permissions,
			schoolId,
			isAuthenticated: user !== null,
			isLoading,
			refreshUser,
			clearUser,
		}),
		[user, activeRole, permissions, schoolId, isLoading, refreshUser, clearUser],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
