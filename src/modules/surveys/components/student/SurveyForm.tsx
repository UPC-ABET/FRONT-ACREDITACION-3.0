'use client';

import React, { useState } from 'react';
import { Button, TextArea, Toast } from '@/shared/components';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import type { SurveyCommissionGroup, SurveyTokenVerification } from '../../types';

interface SurveyFormProps {
	verification: SurveyTokenVerification;
	outcomes: SurveyCommissionGroup[];
	submitting: boolean;
	error: string | null;
	onScoreChange: (commissionId: number, outcomeId: number, score: number) => void;
	onSubmit: (comment: string) => void;
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

export function SurveyForm({
	verification,
	outcomes,
	submitting,
	error,
	onScoreChange,
	onSubmit,
}: SurveyFormProps) {
	const { t } = useI18n();
	const [comment, setComment] = useState('');
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	const scoreLabels: Record<number, string> = {
		1: t('surveys.student.score.1'),
		2: t('surveys.student.score.2'),
		3: t('surveys.student.score.3'),
		4: t('surveys.student.score.4'),
		5: t('surveys.student.score.5'),
	};

	function handleSubmit() {
		const allAnswered = outcomes.every((g) => g.outcomes.every((o) => o.score !== null));
		if (!allAnswered) {
			setToast({
				open: true,
				type: 'error',
				msg: t('surveys.student.error.incomplete'),
			});
			return;
		}
		if (!comment.trim()) {
			setToast({ open: true, type: 'error', msg: t('surveys.student.error.commentRequired') });
			return;
		}
		onSubmit(comment);
	}

	const totalOutcomes = outcomes.reduce((acc, g) => acc + g.outcomes.length, 0);
	const answeredOutcomes = outcomes.reduce(
		(acc, g) => acc + g.outcomes.filter((o) => o.score !== null).length,
		0,
	);
	const progress = totalOutcomes > 0 ? Math.round((answeredOutcomes / totalOutcomes) * 100) : 0;

	return (
		<div className="min-h-screen bg-zinc-50">
			<div className="bg-red-600 text-white py-8 px-6">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center gap-3 mb-4">
						<img src="/assets/ABETLogo.png" alt="ABET" className="h-10 w-auto" />
						<div>
							<h1 className="text-xl font-bold">{t('surveys.student.title')}</h1>
							<p className="text-red-200 text-sm">{t('surveys.student.subtitle')}</p>
						</div>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
						<div>
							<span className="text-red-300 text-xs block">
								{t('surveys.student.programLabel')}
							</span>
							<span className="font-medium">{verification.programName}</span>
						</div>
						<div>
							<span className="text-red-300 text-xs block">{t('surveys.student.periodLabel')}</span>
							<span className="font-medium">{verification.period}</span>
						</div>
						{verification.courseName && (
							<div>
								<span className="text-red-300 text-xs block">
									{t('surveys.student.courseLabel')}
								</span>
								<span className="font-medium">{verification.courseName}</span>
							</div>
						)}
						{verification.studentCode && (
							<div>
								<span className="text-red-300 text-xs block">
									{t('surveys.student.studentLabel')}
								</span>
								<span className="font-medium">{verification.studentCode}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
				<div className="max-w-3xl mx-auto px-6 py-3">
					<div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
						<span>{t('surveys.student.progressLabel')}</span>
						<span>
							{t('surveys.student.progressText')
								.replace('{{answered}}', String(answeredOutcomes))
								.replace('{{total}}', String(totalOutcomes))
								.replace('{{pct}}', String(progress))}
						</span>
					</div>
					<div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
						<div
							className="h-2 bg-red-600 rounded-full transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			<div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
				<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
					<ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
					<div className="text-sm text-amber-800">
						<strong>{t('surveys.student.instructionsTitle')}</strong>{' '}
						{t('surveys.student.instructionsBody')}
					</div>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
						{tryTranslate(t, error)}
					</div>
				)}

				{outcomes.map((group) => (
					<div
						key={group.commissionId}
						className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
						<div className="bg-red-600 px-6 py-3">
							<h2 className="text-white font-bold text-sm">{group.commissionName}</h2>
						</div>

						<div className="divide-y divide-zinc-100">
							{group.outcomes.map((outcome) => (
								<div key={outcome.outcomeId} className="px-6 py-5">
									<div className="mb-3">
										<p className="text-sm font-bold text-zinc-800">{outcome.specificCompetence}</p>
										{outcome.generalCompetence && (
											<p className="text-xs text-zinc-500 mt-0.5">
												{t('surveys.student.generalPrefix')} {outcome.generalCompetence}
											</p>
										)}
										{outcome.description && (
											<p className="text-xs text-zinc-500 mt-1 leading-relaxed">
												{outcome.description}
											</p>
										)}
									</div>

									<div className="flex flex-wrap gap-2">
										{SCORE_OPTIONS.map((s) => {
											const selected = outcome.score === s;
											return (
												<button
													key={s}
													onClick={() => onScoreChange(group.commissionId, outcome.outcomeId, s)}
													className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all
                            ${
															selected
																? 'border-red-600 bg-red-600 text-white'
																: 'border-zinc-200 bg-white text-zinc-600 hover:border-red-400 hover:text-red-600'
														}`}>
													<span className="text-base font-bold leading-none">{s}</span>
													<span className="text-[10px] leading-none">{scoreLabels[s]}</span>
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>
				))}

				<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 px-6 py-5">
					<TextArea
						label={t('surveys.student.commentLabel')}
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						placeholder={t('surveys.student.commentPlaceholder')}
						rows={5}
					/>
				</div>

				<div className="flex justify-end pb-8">
					<Button
						onClick={handleSubmit}
						disabled={submitting || progress < 100 || !comment.trim()}
						loading={submitting}
						size="lg">
						{t('surveys.student.submitButton')}
					</Button>
				</div>
			</div>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}

export function SurveyAlreadyAnswered() {
	const { t } = useI18n();
	return (
		<div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-md w-full text-center space-y-4">
				<CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto" />
				<h2 className="text-xl font-bold text-zinc-900">
					{t('surveys.student.alreadyAnswered.title')}
				</h2>
				<p className="text-sm text-zinc-500">{t('surveys.student.alreadyAnswered.message')}</p>
				<p className="text-xs text-zinc-400">{t('surveys.student.alreadyAnswered.thanks')}</p>
			</div>
		</div>
	);
}

export function SurveySuccess() {
	const { t } = useI18n();
	return (
		<div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-md w-full text-center space-y-4">
				<CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto" />
				<h2 className="text-xl font-bold text-zinc-900">{t('surveys.student.success.title')}</h2>
				<p className="text-sm text-zinc-500">{t('surveys.student.success.message')}</p>
				<p className="text-xs text-zinc-400 mt-2">{t('surveys.student.success.hint')}</p>
			</div>
		</div>
	);
}
