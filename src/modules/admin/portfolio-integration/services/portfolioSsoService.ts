import { apiGet, apiPut, ApiError } from '@/shared/lib';
import { ApiResponse } from '@/shared';
import type {
	PortfolioSsoConfigSummary,
	PortfolioSsoLink,
	UpsertPortfolioSsoConfigBody,
} from '../types';

const BASE_ROUTE = '/admin-iam-portfolio-sso';

export async function getPortfolioSsoConfig(): Promise<PortfolioSsoConfigSummary> {
	const body = await apiGet<ApiResponse<PortfolioSsoConfigSummary>>(`${BASE_ROUTE}/config`);

	if (!body?.data) {
		throw new ApiError(body?.message ?? 'admin.portfolioIntegration.error.loadFailed');
	}
	return body.data;
}

export async function upsertPortfolioSsoConfig(
	payload: UpsertPortfolioSsoConfigBody,
): Promise<PortfolioSsoConfigSummary> {
	const body = await apiPut<ApiResponse<PortfolioSsoConfigSummary>>(
		`${BASE_ROUTE}/config`,
		payload,
	);

	if (!body?.data) {
		throw new ApiError(body?.message ?? 'admin.portfolioIntegration.error.saveFailed');
	}
	return body.data;
}

export async function getPortfolioSsoLink(): Promise<PortfolioSsoLink> {
	const body = await apiGet<ApiResponse<PortfolioSsoLink>>(`${BASE_ROUTE}/link`);

	if (!body?.data) {
		throw new ApiError(body?.message ?? 'admin.portfolioIntegration.error.linkFailed');
	}
	return body.data;
}
