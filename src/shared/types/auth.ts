/**
 * Shared auth-related types
 */

export type ABETContextType = {
	/** Modality type id (TG102 type) selected in the navbar pill switcher. */
	modalityTypeId: number | null;
	setModalityTypeId: (id: number | null) => void;
	/** Global academic period selected in the academic filters bar. */
	academicPeriodId: number | null;
	setAcademicPeriodId: (id: number | null) => void;
};
