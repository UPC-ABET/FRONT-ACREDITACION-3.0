export type BannerSessionStatusValue = 'active' | 'expiring' | 'expired';

export interface BannerSessionStatus {
	status: BannerSessionStatusValue;
	tokenExp: string | null;
}

export interface StartScrapeRequest {
	periodo: string;
	nivel?: string;
	departamentos?: string[];
}

export interface StartScrapeResponse {
	runId: string;
}

export type ScrapeRunStatus = 'running' | 'completed' | 'partial' | 'failed' | 'expired';

export interface ScrapeRunError {
	step: string;
	key: string;
	message: string;
}

export interface ScrapeRunStats {
	departments: {
		requested: string[];
		succeeded: string[];
		failed: string[];
	};
	counts: {
		horario: number;
		matricula: number;
		alumno: number;
	};
	uniqueStudents: number;
	errors: ScrapeRunError[];
	fatal?: string;
}

export interface ScrapeRun {
	status: ScrapeRunStatus;
	stats: ScrapeRunStats | null;
}

export type AuthSessionStatus = 'active' | 'completed' | 'failed' | 'expired';

export interface StartAuthSessionResponse {
	sessionId: string;
	wsUrl: string;
	sessionToken: string;
	expiresAt: string;
}

export interface AuthSessionState {
	status: AuthSessionStatus;
}
