import { apiGet, apiPost } from '@/shared/lib';
import type { CreatePortfolioCompanyDto, PortfolioCompanyResponse } from '../types';

export const portfolioCompaniesService = {
	getAll(academicPeriodId: number, modalityTypeId: number): Promise<PortfolioCompanyResponse[]> {
		return apiGet(
			`/portfolio/get-companies?academicPeriodId=${academicPeriodId}&modalityTypeId=${modalityTypeId}`,
		);
	},

	create(dto: CreatePortfolioCompanyDto): Promise<PortfolioCompanyResponse> {
		return apiPost('/portfolio/create-company', dto);
	},
};
