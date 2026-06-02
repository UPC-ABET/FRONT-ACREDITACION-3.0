'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/shared/lib';
import { TYPE_CODES } from '@/shared/constants';
import type { I18nText } from '@/shared/types';

const DEFAULT_MODALITY_CODE = TYPE_CODES.PROGRAM_MODALITY.REGULAR;

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

export type AuthSchool = {
	id: number;
	code: string;
	name: I18nText;
	facultyId: number;
	facultyCode: string;
	facultyName: I18nText;
};

type AuthState = {
	user: AuthUser | null;
	activeRole: AuthRole | null;
	permissions: string[];
	schoolId: number | null;
	userSchools: AuthSchool[];
	isAuthenticated: boolean;
	isLoading: boolean;
	/** Program modality code (TG102 type) sent to `/users/me`. Defaults to REGULAR. */
	modalityCode: string;
	refreshUser: () => Promise<AuthUser | null>;
	/** Switch the active modality and re-fetch `/users/me` with the selected code. */
	changeModalityCode: (code: string) => Promise<AuthUser | null>;
	clearUser: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

interface MePayload {
	user: AuthUser;
	activeRole: AuthRole;
	allowedRoles: AuthRole[];
	permissions: string[];
	schoolId?: number;
	userSchools?: AuthSchool[];
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
	const [userSchools, setUserSchools] = useState<AuthSchool[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [modalityCode, setModalityCode] = useState<string>(DEFAULT_MODALITY_CODE);

	const fetchUser = useCallback(async (code: string): Promise<AuthUser | null> => {
		try {
			const query = code ? `?modalityCode=${encodeURIComponent(code)}` : '';
			const envelope = await apiGet<Envelope<MePayload>>(`/users/me${query}`);
			const payload = envelope?.data;
			if (!payload?.user) {
				setUser(null);
				return null;
			}
			setUser(payload.user);
			setActiveRole(payload.activeRole ?? null);
			setPermissions(payload.permissions ?? []);
			setSchoolId(payload.schoolId ?? null);
			setUserSchools(payload.userSchools ?? []);
			return payload.user;
		} catch {
			setUser(null);
			setActiveRole(null);
			setPermissions([]);
			setSchoolId(null);
			setUserSchools([]);
			return null;
		}
	}, []);

	const refreshUser = useCallback(async () => {
		setIsLoading(true);
		const refreshedUser = await fetchUser(modalityCode);
		setIsLoading(false);
		return refreshedUser;
	}, [fetchUser, modalityCode]);

	const changeModalityCode = useCallback(
		(code: string) => {
			setModalityCode(code);
			// Re-fetch silently — no global loading toggle so the app doesn't flash a spinner.
			return fetchUser(code);
		},
		[fetchUser],
	);

	const clearUser = useCallback(() => {
		setUser(null);
		setActiveRole(null);
		setPermissions([]);
		setSchoolId(null);
		setUserSchools([]);
	}, []);

	useEffect(() => {
		fetchUser(DEFAULT_MODALITY_CODE).finally(() => setIsLoading(false));
	}, [fetchUser]);

	const value = useMemo<AuthState>(
		() => ({
			user,
			activeRole,
			permissions,
			schoolId,
			userSchools,
			isAuthenticated: user !== null,
			isLoading,
			modalityCode,
			refreshUser,
			changeModalityCode,
			clearUser,
		}),
		[
			user,
			activeRole,
			permissions,
			schoolId,
			userSchools,
			isLoading,
			modalityCode,
			refreshUser,
			changeModalityCode,
			clearUser,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
