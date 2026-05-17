export type I18nText = Record<string, string>;

export interface ScopeOption {
	id: number;
	label: I18nText;
	parent_id: number | null;
}

export interface ScopeLevel {
	level_num: number;
	type_code: string;
	options: ScopeOption[];
}

export interface ScopeTree {
	highest_level: number | null;
	levels: ScopeLevel[];
}

export interface IFCRecord {
	id: number;
	information: Record<string, unknown>;
	extra: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	status_code: string;
	status_label: I18nText;
}

export interface IFCRow {
	chart_id: number;
	course_code: string;
	course_name: I18nText;
	program_label: I18nText;
	coordinator_user_id: number | null;
	coordinator_name: string | null;
	ifc: IFCRecord | null;
}

export interface AcademicPeriod {
	id: number;
	code: string;
	start_date: string;
	end_date: string;
}

export type SelectionValue = number | 'ALL' | null;

export type IFCStatusFilter = 'ALL' | string;

// ---- View payload --------------------------------------------------------

export interface IFCHeader {
	id: number;
	information: Record<string, unknown>;
	extra: Record<string, unknown>;
	created_at: string;
	academic_period_code: string;
	area_label: I18nText;
	subarea_label: I18nText;
	course_name: I18nText;
	course_learning_outcome: I18nText;
	coordinator: {
		user_id: number | null;
		code: string | null;
		name: string | null;
	};
	status: {
		code: string;
		name: I18nText;
		at: string;
		comment: I18nText | null;
		by: string | null;
	} | null;
	requester_in_chain: boolean;
}

export interface OutcomeItem {
	outcome_code: string;
	outcome_name: I18nText;
	outcome_description: I18nText;
}

export interface CommissionGroup {
	commission_code: string;
	commission_name: I18nText;
	outcomes: OutcomeItem[];
}

export interface ProgramGroup {
	program_code: string;
	program_name: I18nText;
	commissions: CommissionGroup[];
}

export interface FindingOutcome extends OutcomeItem {
	commission: { code: string; name: I18nText };
}

export interface FindingAction {
	id: number;
	code: string;
	description: I18nText;
	correlative: number;
	completeness_code: string;
	completeness_name: I18nText;
}

export interface Finding {
	id: number;
	code: string;
	description: I18nText;
	correlative: number;
	is_automatic: boolean;
	criticality: { code: string; name: I18nText };
	outcomes: FindingOutcome[];
	actions: FindingAction[];
}

export interface IFCViewPayload {
	ifc: IFCHeader;
	outcome_course_result: ProgramGroup[];
	findings: Finding[];
}

export interface IFCInformationEntry {
	label: I18nText;
	value: I18nText;
	order: number;
}

export interface RejectIFCBody {
	comment: I18nText;
}

// ---- Form schema -----------------------------------------------------------

export interface IFCField {
	key: string;
	label: I18nText;
	required: boolean;
	order: number;
}

export interface CriticalityOption {
	id: number;
	code: string;
	name: I18nText;
	description: I18nText;
}

// ---- Prefill ---------------------------------------------------------------

export interface IFCPrefill {
	course_name: I18nText;
	course_learning_outcome: I18nText;
	area_label: I18nText;
	subarea_label: I18nText;
	academic_period_code: string;
	coordinator_code: string | null;
	coordinator_name: string | null;
	coordinator_user_id: number | null;
	outcome_course_result: ProgramGroup[];
}

// ---- Form state ------------------------------------------------------------

export interface FormFinding {
	tempId: string;
	id: number | null;
	description: I18nText;
	criticality_code: string;
}

export interface FormAction {
	tempId: string;
	id: number | null;
	description: I18nText;
	finding_temp_id: string;
}

export interface IFCFormState {
	information: Record<string, I18nText>;
	findings: FormFinding[];
	actions: FormAction[];
	deleted_finding_ids: number[];
	deleted_action_ids: number[];
}

// ---- Outbound payloads -----------------------------------------------------

export interface PayloadFinding {
	tempId: string;
	id: number | null;
	description: I18nText;
	criticality_code: string;
}

export interface PayloadAction {
	tempId: string;
	id: number | null;
	description: I18nText;
	finding_temp_id: string;
}

export interface CreateIFCBody {
	chart_id: number;
	period_id: number;
	submit: boolean;
	information?: Record<string, I18nText>;
	findings: PayloadFinding[];
	actions: PayloadAction[];
	deleted_finding_ids?: number[];
	deleted_action_ids?: number[];
}

export type PatchIFCBody = Omit<CreateIFCBody, 'chart_id' | 'period_id'>;
