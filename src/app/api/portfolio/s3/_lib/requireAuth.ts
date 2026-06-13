import { NextRequest, NextResponse } from 'next/server';

/** Returns a 401 response if the request has no valid accessToken cookie; otherwise null. */
export function requireAuth(request: NextRequest): NextResponse | null {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) {
		return NextResponse.json({ error: 'error.auth.unauthorized' }, { status: 401 });
	}
	return null;
}

/** Validates that a key/prefix is scoped to the portfolio/ root. */
export function requirePortfolioScope(value: string): boolean {
	return value.startsWith('portfolio/');
}
