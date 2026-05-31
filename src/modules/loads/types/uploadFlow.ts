export const STAGES = ['PRE_ENROLL', 'START_TERM', 'END_TERM'] as const;
export type StageCode = (typeof STAGES)[number];

export interface FlowDescriptor {
	code: string;
	stage: StageCode;
	uploadType: string;
	// i18n key roots:
	//   - displayKey: short label used by the stage selector / chips.
	//   - formI18nKey: namespace root (e.g. `uploads.sections`) for the standalone upload form,
	//     which expects `<formI18nKey>.title`, `.description`, `.dropzone`, `.error.*`, etc.
	displayKey: string;
	formI18nKey: string;
	expectedHeaders: string[];
	canBannerScrap: boolean;
	uploadPath: string;
}
