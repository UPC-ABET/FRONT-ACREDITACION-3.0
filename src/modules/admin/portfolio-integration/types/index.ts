export interface PortfolioSsoConfigSummary {
	baseUrl: string;
	configured: boolean;
	updatedAt: string | null;
}

export interface UpsertPortfolioSsoConfigBody {
	baseUrl: string;
	apiKey: string;
}

export interface PortfolioSsoLink {
	url: string;
}
