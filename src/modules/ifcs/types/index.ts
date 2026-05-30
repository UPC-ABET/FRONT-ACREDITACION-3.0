import type { I18nText } from '@/shared/types';
export type { I18nText };

export interface ScopeOption {
	id: number;
	label: I18nText;
	parentId: number | null;
}

export interface ScopeLevel {
	levelNum: number;
	typeCode: string;
	options: ScopeOption[];
}

export interface ScopeTree {
	highestLevel: number | null;
	levels: ScopeLevel[];
}

export interface IFCRecord {
	id: number;
	information: Record<string, unknown>;
	extra: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
	statusCode: string;
	statusLabel: I18nText;
	statusColor?: string;
}

export interface IFCRow {
	chartId: number;
	courseCode: string;
	courseName: I18nText;
	programLabel: I18nText;
	coordinatorUserId: number | null;
	coordinatorName: string | null;
	ifc: IFCRecord | null;
}

export type SelectionValue = number | 'ALL' | null;

export type IFCStatusFilter = 'ALL' | string;

export interface FindingRow {
	id: number;
	ifcId: number;
	courseId: number;
	criticalityCode: string;
	criticalityName: I18nText;
	criticalityColor?: string;
	criticalityOrder: number;
	findingCode: string;
	academicPeriodCode: string;
	description: I18nText;
}

// ---- View payload --------------------------------------------------------

export interface IFCHeader {
	id: number;
	information: Record<string, unknown>;
	extra: Record<string, unknown>;
	createdAt: string;
	academicPeriodCode: string;
	areaLabel: I18nText;
	subareaLabel: I18nText;
	programLabel: I18nText;
	courseCode: string;
	courseName: I18nText;
	courseLearningOutcome: I18nText;
	coordinator: {
		userId: number | null;
		code: string | null;
		name: string | null;
	};
	status: {
		code: string;
		name: I18nText;
		color?: string;
		at: string;
		comment: I18nText | null;
		by: string | null;
	} | null;
	requesterInChain: boolean;
}

export interface OutcomeItem {
	outcomeCode: string;
	outcomeName: I18nText;
	outcomeDescription: I18nText;
}

export interface CommissionGroup {
	commissionCode: string;
	commissionName: I18nText;
	outcomes: OutcomeItem[];
}

export interface ProgramGroup {
	programCode: string;
	programName: I18nText;
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
	completeness: { code: string; name: I18nText; color?: string };
}

export interface Finding {
	id: number;
	code: string;
	description: I18nText;
	correlative: number;
	isAutomatic: boolean;
	criticality: { code: string; name: I18nText; color?: string };
	outcomes: FindingOutcome[];
	actions: FindingAction[];
}

export interface PreviousAction {
	id: number;
	findingActionId: number;
	finding: { id: number; code: string };
	code: string;
	correlative: number;
	description: I18nText;
	evidences: I18nText | null;
	completeness: { code: string; name: I18nText; color?: string };
	source: 'direct' | 'plan' | string;
}

export interface IFCViewPayload {
	ifc: IFCHeader;
	outcomeCourseResult: ProgramGroup[];
	findings: Finding[];
	previousActions: PreviousAction[];
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
	courseName: I18nText;
	courseLearningOutcome: I18nText;
	areaLabel: I18nText;
	subareaLabel: I18nText;
	academicPeriodCode: string;
	coordinatorCode: string | null;
	coordinatorName: string | null;
	coordinatorUserId: number | null;
	outcomeCourseResult: ProgramGroup[];
	previousActions: PreviousAction[];
}

// ---- Form state ------------------------------------------------------------

export interface FormFinding {
	tempId: string;
	id: number | null;
	description: I18nText;
	criticalityCode: string;
}

export interface FormAction {
	tempId: string;
	id: number | null;
	description: I18nText;
	findingTempId: string;
}

export interface IFCFormState {
	information: Record<string, I18nText>;
	findings: FormFinding[];
	actions: FormAction[];
	deletedFindingIds: number[];
	deletedActionIds: number[];
	previousActions: Record<number, I18nText | null>;
}

// ---- Outbound payloads -----------------------------------------------------

export interface PayloadFinding {
	tempId: string;
	id: number | null;
	description: I18nText;
	criticalityCode: string;
}

export interface PayloadAction {
	tempId: string;
	id: number | null;
	description: I18nText;
	findingTempId: string;
}

export interface PayloadPreviousActionEvidence {
	findingActionId: number;
	evidences: I18nText | null;
}

export interface CreateIFCBody {
	chartId: number;
	periodId: number;
	submit: boolean;
	information?: Record<string, I18nText>;
	findings: PayloadFinding[];
	actions: PayloadAction[];
	deletedFindingIds?: number[];
	deletedActionIds?: number[];
	previousActions?: PayloadPreviousActionEvidence[];
}

export type PatchIFCBody = Omit<CreateIFCBody, 'chartId' | 'periodId'>;

// ---- Finding detail view ---------------------------------------------------

export interface FindingDetail {
	id: number;
	findingCode: string;
	academicPeriodCode: string;
	description: I18nText;
	criticality: { code: string; name: I18nText; color?: string };
}

export interface FindingActionRow {
	id: number;
	actionCode: string;
	description: I18nText;
	completeness: { code: string; name: I18nText; color?: string };
}

export interface FindingDetailPayload {
	finding: FindingDetail;
	actions: FindingActionRow[];
}

export interface PatchFindingBody {
	description: I18nText;
}

// ---- Notify ----------------------------------------------------------------

export type NotifyReason = 'noCourseChart' | 'noConfig' | 'noRecipients' | 'sendFailed';

export interface NotifyResult {
	sent: boolean;
	recipientsCount: number;
	ccCount: number;
	reason: NotifyReason | null;
}

export interface NotifyAllResult {
	sent: number[];
	skipped: number[];
	errors: Array<{ chartId: number; message: string }>;
}

export interface SubmitResult {
	id: number;
	notification: NotifyResult;
}
