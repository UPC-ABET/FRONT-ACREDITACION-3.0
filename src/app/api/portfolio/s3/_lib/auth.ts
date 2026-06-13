import { NextRequest, NextResponse } from 'next/server';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/**
 * Gate for the S3 route handlers. Validates the caller's session by forwarding
 * the incoming auth cookie to the backend `/users/me`. Returns a 401 response
 * when the session is missing or invalid, or `null` when the caller may proceed.
 *
 * Fine-grained authorization (which folders a user may touch) is the backend's
 * job — see PORTFOLIO_BACKEND_CONTRACT.md. This only enforces authentication.
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
	const cookie = request.headers.get('cookie');
	if (!cookie) return unauthorized();

	try {
		const res = await fetch(`${API_URL}/users/me`, {
			headers: { cookie, accept: 'application/json' },
			cache: 'no-store',
		});
		return res.ok ? null : unauthorized();
	} catch {
		return unauthorized();
	}
}

function unauthorized(): NextResponse {
	return NextResponse.json({ error: 'error.s3.unauthorized' }, { status: 401 });
}
