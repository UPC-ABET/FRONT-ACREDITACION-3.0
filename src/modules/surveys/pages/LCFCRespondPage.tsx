'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useSurvey, useGRASurvey } from '../hooks';
import { getLCFCStudentSurveys } from '../services';
import type { LCFCStudentSurveyItem } from '../types';
import { SurveyForm, SurveyAlreadyAnswered } from '../components';
import { LCFC_SURVEY_SCHOOL_ID } from '../constants/survey';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';

function CenteredCard({ children }: { readonly children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-md text-center space-y-3">
				{children}
			</div>
		</div>
	);
}

function LoadingScreen() {
	const { t } = useI18n();
	return (
		<div className="min-h-screen bg-zinc-50 flex items-center justify-center">
			<div className="text-center space-y-3">
				<div className="h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
				<p className="text-sm text-zinc-500">{t('surveys.student.loading')}</p>
			</div>
		</div>
	);
}

/** Answers a single LCFC survey. */
function LCFCSurveyAnswer({
	token,
	onSubmitted,
	onBack,
}: {
	readonly token: string;
	readonly onSubmitted: () => void;
	readonly onBack: () => void;
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
		if (token) verify(LCFC_SURVEY_SCHOOL_ID, token);
	}, [token, verify]);

	useEffect(() => {
		if (submitted) onSubmitted();
	}, [submitted, onSubmitted]);

	if (loading) return <LoadingScreen />;

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
	if (submitted) return null;
	if (!verification) return null;

	return (
		<SurveyForm
			verification={verification}
			outcomes={outcomes}
			submitting={submitting}
			error={error}
			onScoreChange={updateScore}
			onSubmit={submit}
			onBack={onBack}
		/>
	);
}

/** Answers a single GRA survey. */
function GRASurveyAnswer({
	token,
	onSubmitted,
	onBack,
}: {
	readonly token: string;
	readonly onSubmitted: () => void;
	readonly onBack: () => void;
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
	} = useGRASurvey();

	useEffect(() => {
		if (token) verify(token);
	}, [token, verify]);

	useEffect(() => {
		if (submitted) onSubmitted();
	}, [submitted, onSubmitted]);

	if (loading) return <LoadingScreen />;

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
	if (submitted) return null;
	if (!verification) return null;

	return (
		<SurveyForm
			verification={verification}
			outcomes={outcomes}
			submitting={submitting}
			error={error}
			onScoreChange={updateScore}
			onSubmit={submit}
			onBack={onBack}
		/>
	);
}

function SurveyTypeBadge({ type }: { readonly type: string }) {
	if (type === 'GRA') {
		return (
			<span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide shrink-0">
				GRA
			</span>
		);
	}
	return (
		<span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 uppercase tracking-wide shrink-0">
			LCFC
		</span>
	);
}

export default function LCFCRespondPage() {
	const { t } = useI18n();
	const searchParams = useSearchParams();
	const entryToken = searchParams.get('token') ?? '';

	const [activeItem, setActiveItem] = useState<LCFCStudentSurveyItem | null>(null);
	const [justCompleted, setJustCompleted] = useState(false);

	const {
		data: surveyData,
		isLoading: loadingList,
		error: listQueryError,
		refetch,
	} = useQuery({
		queryKey: ['lcfc-student-surveys', entryToken],
		queryFn: () => getLCFCStudentSurveys(entryToken),
		enabled: Boolean(entryToken),
	});

	const data = surveyData ?? null;
	const listError = listQueryError
		? listQueryError.message
		: surveyData === null
			? 'error.survey.lcfc.tokenNotFound'
			: null;

	const pending = data?.surveys.filter((s) => !s.completed) ?? [];

	// Auto-redirect to the list 3 seconds after completing one, if any remain pending.
	useEffect(() => {
		if (!justCompleted || pending.length === 0) return;
		const id = setTimeout(() => {
			setJustCompleted(false);
			setActiveItem(null);
		}, 3000);
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

	if (loadingList) return <LoadingScreen />;

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
								setActiveItem(null);
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

	const onBack = () => setActiveItem(null);
	const onSubmitted = () => {
		setActiveItem(null);
		setJustCompleted(true);
		void refetch();
	};

	// Answering a specific survey.
	if (activeItem) {
		if (activeItem.surveyType === 'GRA') {
			return (
				<GRASurveyAnswer
					key={activeItem.token}
					token={activeItem.token}
					onBack={onBack}
					onSubmitted={onSubmitted}
				/>
			);
		}
		return (
			<LCFCSurveyAnswer
				key={activeItem.token}
				token={activeItem.token}
				onBack={onBack}
				onSubmitted={onSubmitted}
			/>
		);
	}

	// Survey list panel.
	return (
		<div className="min-h-screen bg-zinc-50">
			<div className="bg-red-600 text-white py-8 px-6">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center gap-3 mb-4">
						<Image
							src="/assets/ABETLogo.png"
							alt="ABET"
							width={515}
							height={484}
							className="h-10 w-auto"
						/>
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
						<div className="min-w-0 flex items-start gap-2">
							<SurveyTypeBadge type={s.surveyType} />
							<div className="min-w-0">
								<p className="font-semibold text-zinc-800 truncate">{s.courseName}</p>
								{s.sectionCode && <p className="text-xs text-zinc-500">{s.sectionCode}</p>}
							</div>
						</div>
						{s.completed ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 shrink-0">
								<CheckCircleIcon className="h-4 w-4" />
								{t('surveys.student.myList.statusCompleted')}
							</span>
						) : (
							<button
								onClick={() => setActiveItem(s)}
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
