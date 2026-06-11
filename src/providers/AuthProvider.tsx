'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
	ApiError,
	apiGet,
	clearPreferenceCookies,
	hasRouteAccess,
	logger,
	setActiveSchoolId,
} from '@/shared/lib';
import { logoutUser } from '@/modules/auth/services';
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

export type AuthPermission = {
	id: number;
	code: string;
	module: string;
	route: string;
	permissions: string[];
};

type AuthState = {
	user: AuthUser | null;
	activeRole: AuthRole | null;
	permissions: AuthPermission[];
	allowedRoutes: string[];
	schoolId: number | null;
	userSchools: AuthSchool[];
	isAuthenticated: boolean;
	isLoading: boolean;
	modalityCode: string;
	canAccessRoute: (path: string) => boolean;
	refreshUser: (options?: { showGlobalLoading?: boolean }) => Promise<AuthUser | null>;
	changeModalityCode: (code: string) => Promise<AuthUser | null>;
	clearUser: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

interface MePayload {
	user: AuthUser;
	activeRole: AuthRole;
	allowedRoles: AuthRole[];
	permissions: AuthPermission[];
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
	const [permissions, setPermissions] = useState<AuthPermission[]>([]);
	const [schoolId, setSchoolId] = useState<number | null>(null);
	const [userSchools, setUserSchools] = useState<AuthSchool[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [modalityCode, setModalityCode] = useState<string>(DEFAULT_MODALITY_CODE);

	const clearAuthState = useCallback(() => {
		setUser(null);
		setActiveRole(null);
		setPermissions([]);
		setSchoolId(null);
		setUserSchools([]);
		setActiveSchoolId(null);
	}, []);

	const fetchUser = useCallback(
		async (code: string, throwOnNoPermissions = false): Promise<AuthUser | null> => {
			try {
				const query = code ? `?modalityCode=${encodeURIComponent(code)}` : '';
				const envelope = await apiGet<Envelope<MePayload>>(`/users/me${query}`);
				const payload = envelope?.data;
				if (!payload?.user) {
					clearAuthState();
					return null;
				}

				const nextPermissions = payload.permissions ?? [];
				if (nextPermissions.length === 0) {
					clearAuthState();
					clearPreferenceCookies();
					try {
						await logoutUser();
					} catch (err: unknown) {
						logger.warn('Failed to close backend session for user without permissions', err);
					}
					if (throwOnNoPermissions) {
						throw new ApiError('error.auth.noPermissionsConfigured', 403);
					}
					return null;
				}

				setUser(payload.user);
				setActiveRole(payload.activeRole ?? null);
				setPermissions(nextPermissions);
				setSchoolId(payload.schoolId ?? null);
				setUserSchools(payload.userSchools ?? []);
				return payload.user;
			} catch (err: unknown) {
				clearAuthState();
				if (throwOnNoPermissions && err instanceof ApiError) throw err;
				return null;
			}
		},
		[clearAuthState],
	);

	const refreshUser = useCallback(
		async (options?: { showGlobalLoading?: boolean }) => {
			const showGlobalLoading = options?.showGlobalLoading ?? true;
			if (showGlobalLoading) {
				setIsLoading(true);
			}
			try {
				return await fetchUser(modalityCode, true);
			} finally {
				if (showGlobalLoading) {
					setIsLoading(false);
				}
			}
		},
		[fetchUser, modalityCode],
	);

	const changeModalityCode = useCallback(
		(code: string) => {
			setModalityCode(code);
			return fetchUser(code);
		},
		[fetchUser],
	);

	const clearUser = useCallback(() => {
		clearAuthState();
	}, [clearAuthState]);

	const allowedRoutes = useMemo(
		() =>
			permissions
				.map((permission) => permission.route)
				.filter((route): route is string => typeof route === 'string' && route.trim() !== ''),
		[permissions],
	);

	const canAccessRoute = useCallback(
		(path: string) => hasRouteAccess(path, allowedRoutes),
		[allowedRoutes],
	);

	useEffect(() => {
		fetchUser(DEFAULT_MODALITY_CODE).finally(() => setIsLoading(false));
	}, [fetchUser]);

	const value = useMemo<AuthState>(
		() => ({
			user,
			activeRole,
			permissions,
			allowedRoutes,
			schoolId,
			userSchools,
			isAuthenticated: user !== null,
			isLoading,
			modalityCode,
			canAccessRoute,
			refreshUser,
			changeModalityCode,
			clearUser,
		}),
		[
			user,
			activeRole,
			permissions,
			allowedRoutes,
			schoolId,
			userSchools,
			isLoading,
			modalityCode,
			canAccessRoute,
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
