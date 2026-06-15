'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSurvey } from '@/modules/surveys/hooks';
import { SurveyForm, SurveyAlreadyAnswered, SurveySuccess } from '@/modules/surveys/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';

export default function LCFCSurveyRespondPage() {
	const { t } = useI18n();
	const searchParams = useSearchParams();
	const escuela = searchParams.get('escuela') ?? '1';
	const token = searchParams.get('token') ?? '';

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
		if (token) verify(escuela, token);
	}, [token, escuela, verify]);

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

	if (!token) {
		return (
			<div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
				<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-md text-center space-y-3">
					<p className="text-2xl">⚠️</p>
					<h2 className="text-lg font-bold text-zinc-900">
						{t('surveys.student.invalidLink.title')}
					</h2>
					<p className="text-sm text-zinc-500">{t('surveys.student.invalidLink.message')}</p>
				</div>
			</div>
		);
	}

	if (error && !verification) {
		return (
			<div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
				<div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 max-w-md text-center space-y-3">
					<p className="text-2xl">❌</p>
					<h2 className="text-lg font-bold text-zinc-900">
						{t('surveys.student.accessError.title')}
					</h2>
					<p className="text-sm text-zinc-500">{tryTranslate(t, error)}</p>
				</div>
			</div>
		);
	}

	if (submitted) return <SurveySuccess />;
	if (alreadyAnswered) return <SurveyAlreadyAnswered />;

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
