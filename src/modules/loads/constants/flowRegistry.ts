import type { UploadFlow } from '../types';

// Each entry maps a TG1101 type code to the per-slug backend endpoints.
// Mirrors the contract documented for /uploads/<slug>/{template,upload,rollback}.
const flowsList: UploadFlow[] = [
	{ typeCode: 'TG1101-T001', slug: 'professors' },
	{ typeCode: 'TG1101-T002', slug: 'study-plans' },
	{ typeCode: 'TG1101-T003', slug: 'outcomes' },
	{ typeCode: 'TG1101-T004', slug: 'charts' },
	{ typeCode: 'TG1101-T005', slug: 'sections' },
	{ typeCode: 'TG1101-T006', slug: 'enrolled-students' },
	{ typeCode: 'TG1101-T007', slug: 'grades-banner' },
	{ typeCode: 'TG1101-T008', slug: 'grades-rc' },
	{ typeCode: 'TG1101-T009', slug: 'articulation' },
	{ typeCode: 'TG1101-T010', slug: 'student-sections' },
].map(({ typeCode, slug }) => ({
	typeCode,
	slug,
	uploadPath: `/uploads/${slug}/upload`,
	templatePath: `/uploads/${slug}/template`,
	rollbackPath: `/uploads/${slug}/rollback`,
}));

export const UPLOAD_FLOWS = flowsList;

const FLOWS_BY_TYPE_CODE = new Map(flowsList.map((flow) => [flow.typeCode, flow]));

export const findFlowByTypeCode = (typeCode: string): UploadFlow | undefined =>
	FLOWS_BY_TYPE_CODE.get(typeCode);
