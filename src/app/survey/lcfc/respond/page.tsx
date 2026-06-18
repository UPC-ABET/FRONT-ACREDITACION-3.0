'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useSurvey } from '@/modules/surveys/hooks';
import { getLCFCStudentSurveys } from '@/modules/surveys/services';
import type { LCFCStudentSurveys } from '@/modules/surveys/types';
import { SurveyForm, SurveyAlreadyAnswered } from '@/modules/surveys/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';

const ESCUELA = '1';

/** Centered card used for loading / error / invalid states. */
function CenteredCard({ children }: { readonly children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-md text-center space-y-3">
				{children}
			</div>
		</div>
	);
}

/** Answers a single survey (by its own token); reuses the existing survey flow. */
function SurveyAnswer({
	token,
	onSubmitted,
}: {
	readonly token: string;
	readonly onSubmitted: () => void;
}) {
	const { t } = useI18n();
	const {
		verification,
		outcomes,
		loading,
		submitting,
		submitted,
		alreadyAnswered,
		error,
		verify,
		updateScore,
		submit,
	} = useSurvey();

	useEffect(() => {
		if (token) verify(ESCUELA, token);
	}, [token, verify]);

	useEffect(() => {
		if (submitted) onSubmitted();
	}, [submitted, onSubmitted]);

	if (loading) {
		return (
			<div className="min-h-screen bg-zinc-50 flex items-center justify-center">
				<div className="text-center space-y-3">
					<div className="h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="text-sm text-zinc-500">{t('surveys.student.loading')}</p>
				</div>
			</div>
		);
	}

	if (error && !verification) {
		return (
			<CenteredCard>
				<p className="text-2xl">❌</p>
				<h2 className="text-lg font-bold text-zinc-900">
					{t('surveys.student.accessError.title')}
				</h2>
				<p className="text-sm text-zinc-500">{tryTranslate(t, error)}</p>
			</CenteredCard>
		);
	}

	if (alreadyAnswered) return <SurveyAlreadyAnswered />;
	if (submitted) return null; // parent renders the post-submit screen
	if (!verification) return null;

	return (
		<SurveyForm
			verification={verification}
			outcomes={outcomes}
			submitting={submitting}
			error={error}
			onScoreChange={updateScore}
			onSubmit={submit}
		/>
	);
}

export default function LCFCSurveyRespondPage() {
	const { t } = useI18n();
	const searchParams = useSearchParams();
	const entryToken = searchParams.get('token') ?? '';

	const [data, setData] = useState<LCFCStudentSurveys | null>(null);
	const [loadingList, setLoadingList] = useState(true);
	const [listError, setListError] = useState<string | null>(null);
	const [activeToken, setActiveToken] = useState<string | null>(null);
	const [justCompleted, setJustCompleted] = useState(false);

	const fetchList = useCallback(() => {
		if (!entryToken) {
			setLoadingList(false);
			return;
		}
		setLoadingList(true);
		getLCFCStudentSurveys(entryToken)
			.then((d) => {
				setData(d);
				setListError(d ? null : 'error.survey.lcfc.tokenNotFound');
			})
			.catch((e) => setListError((e as Error).message))
			.finally(() => setLoadingList(false));
	}, [entryToken]);

	useEffect(() => {
		fetchList();
	}, [fetchList]);

	const pending = data?.surveys.filter((s) => !s.completed) ?? [];

	// Auto-redirect to the list a few seconds after completing one, if any remain pending.
	useEffect(() => {
		if (!justCompleted || pending.length === 0) return;
		const id = setTimeout(() => {
			setJustCompleted(false);
			setActiveToken(null);
		}, 4000);
		return () => clearTimeout(id);
	}, [justCompleted, pending.length]);

	if (!entryToken) {
		return (
			<CenteredCard>
				<p className="text-2xl">⚠️</p>
				<h2 className="text-lg font-bold text-zinc-900">
					{t('surveys.student.invalidLink.title')}
				</h2>
				<p className="text-sm text-zinc-500">{t('surveys.student.invalidLink.message')}</p>
			</CenteredCard>
		);
	}

	if (loadingList) {
		return (
			<div className="min-h-screen bg-zinc-50 flex items-center justify-center">
				<div className="text-center space-y-3">
					<div className="h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="text-sm text-zinc-500">{t('surveys.student.loading')}</p>
				</div>
			</div>
		);
	}

	if (listError || !data) {
		return (
			<CenteredCard>
				<p className="text-2xl">❌</p>
				<h2 className="text-lg font-bold text-zinc-900">
					{t('surveys.student.accessError.title')}
				</h2>
				<p className="text-sm text-zinc-500">{tryTranslate(t, listError ?? '')}</p>
			</CenteredCard>
		);
	}

	// Post-submit screen.
	if (justCompleted) {
		return (
			<CenteredCard>
				<CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto" />
				<h2 className="text-xl font-bold text-zinc-900">{t('surveys.student.success.title')}</h2>
				<p className="text-sm text-zinc-500">{t('surveys.student.success.message')}</p>
				{pending.length > 0 ? (
					<div className="space-y-3 pt-2">
						<p className="text-sm font-medium text-amber-700">
							{t('surveys.student.pendingRedirect').replace('{{count}}', String(pending.length))}
						</p>
						<button
							onClick={() => {
								setJustCompleted(false);
								setActiveToken(null);
							}}
							className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
							{t('surveys.student.goToPending')}
							<ArrowRightIcon className="h-4 w-4" />
						</button>
					</div>
				) : (
					<p className="text-xs text-zinc-400 mt-2">{t('surveys.student.success.hint')}</p>
				)}
			</CenteredCard>
		);
	}

	// Answering a specific survey.
	if (activeToken) {
		return (
			<SurveyAnswer
				key={activeToken}
				token={activeToken}
				onSubmitted={() => {
					setActiveToken(null);
					setJustCompleted(true);
					fetchList();
				}}
			/>
		);
	}

	// If there's a single survey, jump straight into it.
	if (data.surveys.length === 1 && !data.surveys[0].completed) {
		return (
			<SurveyAnswer
				key={data.surveys[0].token}
				token={data.surveys[0].token}
				onSubmitted={() => {
					setJustCompleted(true);
					fetchList();
				}}
			/>
		);
	}

	// Survey list ("my surveys").
	return (
		<div className="min-h-screen bg-zinc-50">
			<div className="bg-red-600 text-white py-8 px-6">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center gap-3 mb-4">
						<img src="/assets/ABETLogo.png" alt="ABET" className="h-10 w-auto" />
						<div>
							<h1 className="text-xl font-bold">{t('surveys.student.myList.title')}</h1>
							<p className="text-red-200 text-sm">{t('surveys.student.myList.subtitle')}</p>
						</div>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
						<div>
							<span className="text-red-300 text-xs block">
								{t('surveys.student.programLabel')}
							</span>
							<span className="font-medium">{data.programName}</span>
						</div>
						<div>
							<span className="text-red-300 text-xs block">{t('surveys.student.periodLabel')}</span>
							<span className="font-medium">{data.period}</span>
						</div>
						<div>
							<span className="text-red-300 text-xs block">
								{t('surveys.student.studentLabel')}
							</span>
							<span className="font-medium">{data.studentCode}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
				{data.surveys.map((s) => (
					<div
						key={s.token}
						className="flex items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-zinc-200 px-5 py-4">
						<div className="min-w-0">
							<p className="font-semibold text-zinc-800 truncate">{s.courseName}</p>
							{s.sectionCode && <p className="text-xs text-zinc-500">{s.sectionCode}</p>}
						</div>
						{s.completed ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
								<CheckCircleIcon className="h-4 w-4" />
								{t('surveys.student.myList.statusCompleted')}
							</span>
						) : (
							<button
								onClick={() => setActiveToken(s.token)}
								className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 shrink-0">
								{t('surveys.student.myList.respond')}
								<ArrowRightIcon className="h-4 w-4" />
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
