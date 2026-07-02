'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Button, Input, Skeleton } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { CommissionTabs } from '../rubric-editor/CommissionTabs';
import { OutcomeCard } from '../rubric-editor/OutcomeCard';
import { useOutcomes } from '@/modules/accreditation/hooks';
import type { OutcomeWithCriteria, CriteriaItem } from '../../types';
import type { Step1Data } from './WizardStep1';
import type { Step2Data } from './WizardStep2';

export interface MultipleCompetencyPayloadQuestion {
	outcomeId: number;
	question: { es: string; en: string };
	criterias: { criteria: { es: string; en: string }; minValue: number; maxValue: number }[];
}

interface LocalCriteria {
	id: string;
	text: { en: string; es: string };
}

interface LocalOutcome {
	outcomeId: number;
	outcomeName: { en: string; es: string };
	outcomeDescription: { en: string; es: string };
	commissionId: string;
	criteria: LocalCriteria[];
	_commissionMeta?: { code: string; name: { en: string; es: string } };
}

interface WizardStep3MultipleCompetencyProps {
	step1: Step1Data;
	step2: Step2Data;
	onBack: () => void;
	onSubmit: (questions: MultipleCompetencyPayloadQuestion[]) => Promise<void>;
	isSubmitting: boolean;
}

function newLocalCriteria(): LocalCriteria {
	return { id: `temp-${Date.now()}-${Math.random()}`, text: { en: '', es: '' } };
}

export function WizardStep3MultipleCompetency({
	step2,
	onBack,
	onSubmit,
	isSubmitting,
}: WizardStep3MultipleCompetencyProps) {
	const { t, locale } = useI18n();
	const [outcomes, setOutcomes] = useState<LocalOutcome[]>([]);
	const [activeCommissionId, setActiveCommissionId] = useState('');
	const [outcomesInitialized, setOutcomesInitialized] = useState(false);

	const {
		data: fetchedOutcomes = [],
		isLoading,
		isError: loadErrored,
	} = useOutcomes(step2.outcomeIds);

	useEffect(() => {
		if (outcomesInitialized || isLoading || !fetchedOutcomes.length) return;

		const loaded: LocalOutcome[] = fetchedOutcomes.map((o) => {
			const commission = o.programCommission?.commission;
			const commissionId = String(
				commission?.id ?? o.programCommission?.id ?? o.programCommissionId ?? 'no-commission',
			);
			return {
				outcomeId: o.id,
				outcomeName: o.outcomeName,
				outcomeDescription: o.outcomeDescription,
				commissionId,
				_commissionMeta: commission ? { code: commission.code, name: commission.name } : undefined,
				criteria: [newLocalCriteria()],
			};
		});

		/* eslint-disable react-hooks/set-state-in-effect -- one-time bootstrap of local editable outcomes from the async-fetched outcome list, guarded by outcomesInitialized */
		setOutcomes(loaded);
		setActiveCommissionId(loaded[0]?.commissionId ?? '');
		setOutcomesInitialized(true);
		/* eslint-enable react-hooks/set-state-in-effect */
	}, [fetchedOutcomes, outcomesInitialized, isLoading]);

	const commissionTabs = useMemo(() => {
		const map = new Map<
			string,
			{ code: string; name: { en: string; es: string }; outcomes: LocalOutcome[] }
		>();

		for (const o of outcomes) {
			const meta = o._commissionMeta;
			if (!map.has(o.commissionId)) {
				map.set(o.commissionId, {
					code: meta?.code ?? o.commissionId,
					name: meta?.name ?? { en: o.commissionId, es: o.commissionId },
					outcomes: [],
				});
			}
			map.get(o.commissionId)!.outcomes.push(o);
		}

		return Array.from(map.entries()).map(([id, { code, name, outcomes: cos }]) => ({
			id,
			code,
			name,
			accreditorCode: '',
			isComplete: cos.every(
				(o) => o.criteria.length > 0 && o.criteria.every((c) => c.text[locale].trim().length > 0),
			),
			outcomes: cos.map<OutcomeWithCriteria>((o) => ({
				id: String(o.outcomeId),
				outcomeCode: o.outcomeName[locale as 'es' | 'en'] ?? o.outcomeName.es,
				outcomeDescription: o.outcomeDescription,
				outcomeType: 'verificacion',
				questions: [
					{
						id: String(o.outcomeId),
						questionText: o.outcomeName,
						criteria: o.criteria.map<CriteriaItem>((c) => ({
							id: c.id,
							description: c.text,
							minValue: 0,
							maxValue: 0,
						})),
					},
				],
			})),
		}));
	}, [outcomes, locale]);

	const activeCommission = commissionTabs.find((c) => c.id === activeCommissionId);

	const allFilled = useMemo(
		() =>
			outcomes.length > 0 &&
			outcomes.every(
				(o) => o.criteria.length > 0 && o.criteria.every((c) => c.text[locale].trim().length > 0),
			),
		[outcomes, locale],
	);

	const updateOutcome = (outcomeId: number, updater: (o: LocalOutcome) => LocalOutcome) =>
		setOutcomes((prev) => prev.map((o) => (o.outcomeId === outcomeId ? updater(o) : o)));

	const addCriteria = (outcomeId: number) =>
		updateOutcome(outcomeId, (o) => ({ ...o, criteria: [...o.criteria, newLocalCriteria()] }));

	const deleteCriteria = (outcomeId: number, ci: number) =>
		updateOutcome(outcomeId, (o) => ({ ...o, criteria: o.criteria.filter((_, i) => i !== ci) }));

	const setCriteriaText = (outcomeId: number, ci: number, text: string) =>
		updateOutcome(outcomeId, (o) => ({
			...o,
			criteria: o.criteria.map((c, i) =>
				i === ci ? { ...c, text: { ...c.text, [locale]: text } } : c,
			),
		}));

	const handleSubmit = async () => {
		if (!allFilled) return;
		await onSubmit(
			outcomes.map((o) => ({
				outcomeId: o.outcomeId,
				question: { es: o.outcomeName.es, en: o.outcomeName.en },
				criterias: o.criteria.map((c) => ({
					criteria: { es: c.text.es, en: c.text.en },
					minValue: 0,
					maxValue: 0,
				})),
			})),
		);
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-36 w-full" />
				<Skeleton className="h-36 w-full" />
			</div>
		);
	}

	if (loadErrored) {
		return (
			<p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				{t('rubrics.wizard.step3.multipleCompetency.error.loadOutcomes')}
			</p>
		);
	}

	return (
		<div className="space-y-6">
			{commissionTabs.length > 0 && (
				<CommissionTabs
					commissions={commissionTabs}
					activeCommissionId={activeCommissionId}
					onCommissionChange={setActiveCommissionId}
					checkboxTooltipIncomplete={t(
						'rubrics.wizard.step3.multipleCompetency.commissionTooltipIncomplete',
					)}
				/>
			)}

			<div className="space-y-4">
				{(activeCommission?.outcomes ?? commissionTabs[0]?.outcomes ?? []).map((outcomeView) => {
					const outcomeId = Number(outcomeView.id);
					const localOutcome = outcomes.find((o) => o.outcomeId === outcomeId);
					if (!localOutcome) return null;

					return (
						<OutcomeCard
							key={outcomeId}
							outcome={outcomeView}
							canEdit={true}
							emptyMessage={t('rubrics.wizard.step3.multipleCompetency.emptyOutcome')}
							emptyMessageWithHint={t('rubrics.wizard.step3.multipleCompetency.emptyOutcomeHint')}
							onAdd={() => addCriteria(outcomeId)}>
							{localOutcome.criteria.map((c, ci) => (
								<div
									key={c.id}
									className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
									<span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">
										{t('rubrics.wizard.step3.multipleCompetency.criteriaLabel')} {ci + 1}
									</span>
									<div className="min-w-[12rem] flex-1">
										<Input
											value={c.text[locale]}
											placeholder={t('rubrics.wizard.step3.multipleCompetency.criteriaPlaceholder')}
											onChange={(e) => setCriteriaText(outcomeId, ci, e.target.value)}
											className="w-full"
										/>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="shrink-0"
										disabled={localOutcome.criteria.length === 1}
										onClick={() => deleteCriteria(outcomeId, ci)}>
										<TrashIcon className="h-5 w-5 text-zinc-500" aria-hidden />
										<span className="sr-only">
											{t('rubrics.wizard.step3.multipleCompetency.deleteCriteria')}
										</span>
									</Button>
								</div>
							))}
						</OutcomeCard>
					);
				})}
			</div>

			{!allFilled && outcomes.length > 0 && (
				<ul className="space-y-1 text-sm">
					<li className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
						<ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
						{t('rubrics.wizard.step3.multipleCompetency.validation.incomplete')}
					</li>
				</ul>
			)}

			{allFilled && (
				<p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
					<CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
					{t('rubrics.wizard.step3.multipleCompetency.validation.complete')}
				</p>
			)}

			<div className="flex justify-between">
				<Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
					{t('rubrics.wizard.step3.back')}
				</Button>
				<Button
					variant="primary"
					disabled={!allFilled || isSubmitting}
					onClick={() => void handleSubmit()}>
					{isSubmitting ? t('rubrics.wizard.step3.submitting') : t('rubrics.wizard.step3.submit')}
				</Button>
			</div>
		</div>
	);
}
