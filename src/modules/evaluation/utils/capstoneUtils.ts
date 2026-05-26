import type { CommissionTab, OutcomeWithCriteria } from '../types';

export function verificationOutcomes(commission: CommissionTab) {
	return commission.outcomes.filter((outcome) => outcome.outcomeType === 'verificacion');
}

/** In capstone rubrics, questions are the leaf items — criteria are never used. */
function outcomeHasQuestions(outcome: OutcomeWithCriteria): boolean {
	return outcome.questions.some(
		(q) => q.questionText.en.trim().length > 0 || q.questionText.es.trim().length > 0,
	);
}

/** An outcome is considered complete when all its questions have non-empty text
 *  in at least one locale. For locale-aware save validation see RubricEditorCapstone. */
function outcomeIsFullyComplete(outcome: OutcomeWithCriteria): boolean {
	return (
		outcome.questions.length > 0 &&
		outcome.questions.every(
			(q) => q.questionText.en.trim().length > 0 || q.questionText.es.trim().length > 0,
		)
	);
}

export function commissionHasAnyQuestions(commission: CommissionTab): boolean {
	return verificationOutcomes(commission).some(outcomeHasQuestions);
}

export function commissionIsFullyComplete(commission: CommissionTab): boolean {
	const outcomes = verificationOutcomes(commission);
	return outcomes.length > 0 && outcomes.every(outcomeIsFullyComplete);
}

export function commissionIsPartial(commission: CommissionTab): boolean {
	return commissionHasAnyQuestions(commission) && !commissionIsFullyComplete(commission);
}

export function canSaveCapstone(commissions: CommissionTab[]): boolean {
	const hasComplete = commissions.some(commissionIsFullyComplete);
	const hasPartial = commissions.some(commissionIsPartial);
	return hasComplete && !hasPartial;
}

export function tabStatus(commission: CommissionTab): 'complete' | 'partial' | 'empty' {
	if (commissionIsFullyComplete(commission)) return 'complete';
	if (commissionHasAnyQuestions(commission)) return 'partial';
	return 'empty';
}

export function countOutcomesConfigured(commission: CommissionTab): {
	done: number;
	total: number;
} {
	const outcomes = verificationOutcomes(commission);
	return {
		total: outcomes.length,
		done: outcomes.filter(outcomeIsFullyComplete).length,
	};
}
