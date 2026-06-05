import { apiGet, apiPost } from '@/shared/lib';
import type { CreatePortfolioResearchLineDto, PortfolioResearchLineResponse } from '../types';

export const portfolioResearchLinesService = {
	getAll(params: { programId?: number; modalityTypeId?: number } = {}): Promise<PortfolioResearchLineResponse[]> {
		const qs = new URLSearchParams();
		if (params.programId != null) qs.set('programId', String(params.programId));
		if (params.modalityTypeId != null) qs.set('modalityTypeId', String(params.modalityTypeId));
		const query = qs.toString();
		return apiGet(`/portfolio/get-research-lines${query ? `?${query}` : ''}`);
	},

	create(dto: CreatePortfolioResearchLineDto): Promise<PortfolioResearchLineResponse> {
		return apiPost('/portfolio/create-research-line', dto);
	},
};
