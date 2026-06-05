'use client';

import { useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Select,
	TextArea,
	Toast,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { useAcademicPeriods, usePrograms } from '@/modules/academic';
import { useCreatePortfolioProject, usePortfolioCompanies } from '../../hooks';
import type { CreatePortfolioProjectDto } from '../../types';

type SelectOption = { label: string; value: number };

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	modalityTypeId: number | null;
};

export function PortfolioCreateForm({ isOpen, onClose, onSuccess, modalityTypeId }: Props) {
	const { t, locale } = useI18n();
	const loc = locale as 'es' | 'en';

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [academicPeriodId, setAcademicPeriodId] = useState<number | null>(null);
	const [programId, setProgramId] = useState<number | null>(null);
	const [companyId, setCompanyId] = useState<number | null>(null);
	const [isFromUPC, setIsFromUPC] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { data: periods = [] } = useAcademicPeriods(
		{ isActive: true, ...(modalityTypeId ? { modalityTypeId } : {}) },
		{ enabled: isOpen },
	);
	const { data: programs = [] } = usePrograms(
		{ isActive: true, ...(modalityTypeId ? { modalityTypeId } : {}) },
	);
	const { data: companies = [] } = usePortfolioCompanies(
		academicPeriodId ?? undefined,
		modalityTypeId ?? undefined,
	);

	const { mutateAsync: createProject, isPending } = useCreatePortfolioProject();

	const periodOptions: SelectOption[] = periods.map((p) => ({ label: p.code, value: p.id }));
	const programOptions: SelectOption[] = programs.map((p) => ({
		label: p.name[loc] ?? p.name.es,
		value: p.id,
	}));
	const companyOptions: SelectOption[] = companies.map((c) => ({
		label: `${c.code} — ${c.name}`,
		value: c.id,
	}));
	const originOptions = [
		{ label: t('portfolio.form.originUpc'), value: 1 },
		{ label: t('portfolio.form.originExternal'), value: 0 },
	];

	const selectedPeriod = periodOptions.find((o) => o.value === academicPeriodId) ?? null;
	const selectedProgram = programOptions.find((o) => o.value === programId) ?? null;
	const selectedCompany = companyOptions.find((o) => o.value === companyId) ?? null;
	const selectedOrigin = originOptions.find((o) => o.value === (isFromUPC ? 1 : 0)) ?? null;

	function reset() {
		setName('');
		setDescription('');
		setAcademicPeriodId(null);
		setProgramId(null);
		setCompanyId(null);
		setIsFromUPC(true);
		setError(null);
	}

	function handleClose() {
		reset();
		onClose();
	}

	async function handleSubmit() {
		if (!name.trim() || !description.trim() || !academicPeriodId || !programId || !modalityTypeId) {
			setError(t('portfolio.form.errorRequired'));
			return;
		}
		if (!companyId) {
			setError(t('portfolio.form.errorCompanyRequired'));
			return;
		}

		const dto: CreatePortfolioProjectDto = {
			name: name.trim(),
			description: description.trim(),
			academicPeriodId,
			modalityTypeId,
			programId,
			isFromUPC,
			companyId,
		};

		try {
			await createProject(dto);
			reset();
			onSuccess();
		} catch (e) {
			setError(getErrorMessage(e, t('portfolio.error.createFailed')));
		}
	}

	return (
		<>
			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) handleClose();
				}}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{t('portfolio.form.title')}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 text-sm">
						<Input
							label={`${t('portfolio.form.fieldName')} *`}
							placeholder={t('portfolio.form.placeholderName')}
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={255}
						/>

						<TextArea
							label={`${t('portfolio.form.fieldDescription')} *`}
							placeholder={t('portfolio.form.placeholderDescription')}
							rows={3}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							maxLength={5000}
						/>

						<Select
							label={`${t('portfolio.form.academicPeriod')} *`}
							value={selectedPeriod}
							options={periodOptions}
							onChange={(_, opt) => setAcademicPeriodId((opt as SelectOption | null)?.value ?? null)}
							isClearable
						/>

						<Select
							label={`${t('portfolio.form.fieldProgram')} *`}
							value={selectedProgram}
							options={programOptions}
							onChange={(_, opt) => setProgramId((opt as SelectOption | null)?.value ?? null)}
							isClearable
						/>

						<Select
							label={t('portfolio.form.origin')}
							value={selectedOrigin}
							options={originOptions}
							onChange={(_, opt) => setIsFromUPC((opt as SelectOption | null)?.value === 1)}
						/>

						<Select
							label={`${t('portfolio.form.fieldCompany')} *`}
							value={selectedCompany}
							options={companyOptions}
							onChange={(_, opt) => setCompanyId((opt as SelectOption | null)?.value ?? null)}
							isClearable
							isDisabled={!academicPeriodId || !modalityTypeId}
						/>
					</div>

					<DialogFooter>
						<Button variant="secondary" onClick={handleClose} disabled={isPending}>
							{t('dialog.actions.cancel')}
						</Button>
						<Button variant="primary" onClick={handleSubmit} disabled={isPending}>
							{isPending ? t('portfolio.form.submitting') : t('portfolio.form.submitBtn')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{error && (
				<Toast isOpen type="error" onClose={() => setError(null)} message={error} />
			)}
		</>
	);
}
