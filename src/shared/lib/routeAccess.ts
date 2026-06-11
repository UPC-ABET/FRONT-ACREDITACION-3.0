function normalizePath(path: string): string {
	const pathOnly = path.split('?')[0]?.split('#')[0] ?? '/';
	if (pathOnly.length > 1 && pathOnly.endsWith('/')) return pathOnly.slice(0, -1);
	return pathOnly || '/';
}

function routeMatches(allowedRoute: string, targetPath: string): boolean {
	const normalizedAllowedRoute = normalizePath(allowedRoute);
	const normalizedTargetPath = normalizePath(targetPath);

	if (normalizedAllowedRoute === '/') return normalizedTargetPath === '/';
	return (
		normalizedTargetPath === normalizedAllowedRoute ||
		normalizedTargetPath.startsWith(`${normalizedAllowedRoute}/`)
	);
}

export function hasRouteAccess(path: string, allowedRoutes: string[]): boolean {
	const normalizedPath = normalizePath(path);

	return allowedRoutes.some((route) => routeMatches(route, normalizedPath));
}

export function getDefaultAuthorizedPath(allowedRoutes: string[]): string | null {
	if (allowedRoutes.includes('/')) return '/';
	return allowedRoutes[0] ?? null;
}
