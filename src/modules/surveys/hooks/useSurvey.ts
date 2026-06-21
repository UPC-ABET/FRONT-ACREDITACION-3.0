'use client';

import { useState, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib';
import type {
	SurveyTokenVerification,
	SurveyOutcomesResponse,
	SurveySubmitRequest,
	SurveyCommissionGroup,
} from '../types';
import {
	verifyLCFCSurveyToken,
	getLCFCSurveyOutcomes,
	submitLCFCSurvey,
	verifyGRASurveyToken,
	getGRASurveyByToken,
	submitGRASurvey,
} from '../services';

export function useSurvey() {
	const [verification, setVerification] = useState<SurveyTokenVerification | null>(null);
	const [surveyData, setSurveyData] = useState<SurveyOutcomesResponse | null>(null);
	const [outcomes, setOutcomes] = useState<SurveyCommissionGroup[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [alreadyAnswered, setAlreadyAnswered] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const verify = useCallback(async (school: string, token: string) => {
		setLoading(true);
		setError(null);
		try {
			const v = await verifyLCFCSurveyToken(school, token);
			setVerification(v);

			if (v.answered === true) {
				setAlreadyAnswered(true);
				return;
			}

			const data = await getLCFCSurveyOutcomes(school, v.studentId, v.surveyId, v.token);
			setSurveyData(data);
			setOutcomes(data.items);
		} catch (e) {
			const msg = getErrorMessage(e);
			// A survey that's already closed is a normal "thank you, already answered"
			// state, not an access error — show the completed screen.
			if (msg?.toLowerCase().includes('alreadycompleted')) {
				setAlreadyAnswered(true);
			} else {
				setError(msg);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	const updateScore = useCallback((commissionId: number, outcomeId: number, score: number) => {
		setOutcomes((prev) =>
			prev.map((group) =>
				group.commissionId === commissionId
					? {
							...group,
							outcomes: group.outcomes.map((o) =>
								o.outcomeId === outcomeId ? { ...o, score } : o,
							),
						}
					: group,
			),
		);
	}, []);

	const submit = useCallback(
		async (comment: string, onSuccess?: () => void) => {
			if (!verification || !surveyData) return;

			const allAnswered = outcomes.every((g) => g.outcomes.every((o) => o.score !== null));
			if (!allAnswered) {
				setError('surveys.student.error.incomplete');
				return;
			}

			setSubmitting(true);
			setError(null);

			const items = outcomes.flatMap((g) =>
				g.outcomes.map((o) => ({
					commissionId: o.commissionId,
					outcomeId: o.outcomeId,
					score: o.score as number,
					description: '',
				})),
			);

			const request: SurveySubmitRequest = {
				token: verification.token,
				comment,
				surveyId: verification.surveyId,
				school: verification.school,
				items,
			};

			try {
				const res = await submitLCFCSurvey(request);
				if (res.success) {
					setSubmitted(true);
					onSuccess?.();
				} else {
					setError('Could not submit the survey. Please try again.');
				}
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setSubmitting(false);
			}
		},
		[verification, surveyData, outcomes],
	);

	return {
		verification,
		surveyData,
		outcomes,
		loading,
		submitting,
		submitted,
		alreadyAnswered,
		error,
		verify,
		updateScore,
		submit,
		setError,
	};
}

export function useGRASurvey() {
	const [verification, setVerification] = useState<SurveyTokenVerification | null>(null);
	const [surveyData, setSurveyData] = useState<SurveyOutcomesResponse | null>(null);
	const [outcomes, setOutcomes] = useState<SurveyCommissionGroup[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [alreadyAnswered, setAlreadyAnswered] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const verify = useCallback(async (token: string) => {
		setLoading(true);
		setError(null);
		try {
			const v = await verifyGRASurveyToken(token);
			setVerification(v);

			if (v.answered === true) {
				setAlreadyAnswered(true);
				return;
			}

			const data = await getGRASurveyByToken(token);
			setSurveyData(data);
			setOutcomes(data.items);
		} catch (e) {
			const msg = getErrorMessage(e);
			if (msg?.toLowerCase().includes('alreadycompleted')) {
				setAlreadyAnswered(true);
			} else {
				setError(msg);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	const updateScore = useCallback((commissionId: number, outcomeId: number, score: number) => {
		setOutcomes((prev) =>
			prev.map((group) =>
				group.commissionId === commissionId
					? {
							...group,
							outcomes: group.outcomes.map((o) =>
								o.outcomeId === outcomeId ? { ...o, score } : o,
							),
						}
					: group,
			),
		);
	}, []);

	const submit = useCallback(
		async (comment: string, onSuccess?: () => void) => {
			if (!verification || !surveyData) return;

			const allAnswered = outcomes.every((g) => g.outcomes.every((o) => o.score !== null));
			if (!allAnswered) {
				setError('surveys.student.error.incomplete');
				return;
			}

			setSubmitting(true);
			setError(null);

			const scores = outcomes.flatMap((g) =>
				g.outcomes.map((o) => ({
					outcomeConfigId: o.outcomeConfigId ?? o.outcomeId,
					score: o.score as number,
				})),
			);

			try {
				const res = await submitGRASurvey(verification.token ?? '', comment, scores);
				if (res.success) {
					setSubmitted(true);
					onSuccess?.();
				} else {
					setError('Could not submit the survey. Please try again.');
				}
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setSubmitting(false);
			}
		},
		[verification, surveyData, outcomes],
	);

	return {
		verification,
		surveyData,
		outcomes,
		loading,
		submitting,
		submitted,
		alreadyAnswered,
		error,
		verify,
		updateScore,
		submit,
		setError,
	};
}
