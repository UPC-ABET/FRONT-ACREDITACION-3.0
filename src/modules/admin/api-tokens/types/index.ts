export interface ApiTokenScope {
	module: string;
	action: string;
}

export interface ApiToken {
	id: number;
	name: string;
	keyId: string;
	scopes: ApiTokenScope[];
	expiresAt: string | null;
	isActive: boolean;
	revokedAt: string | null;
	revokedByUserId: number | null;
	createdByUserId: number;
	createdAt: string;
	updatedAt: string;
}

export interface IssuedApiToken {
	id: number;
	name: string;
	keyId: string;
	scopes: ApiTokenScope[];
	expiresAt: string | null;
	createdAt: string;
	apiKey: string;
}

export interface CreateApiTokenBody {
	name: string;
	scopes: ApiTokenScope[];
	expiresAt?: string;
}

export interface UpdateApiTokenBody {
	name?: string;
	expiresAt?: string | null;
}

export interface ApiTokenFilters {
	name?: string;
	isActive?: boolean;
}
