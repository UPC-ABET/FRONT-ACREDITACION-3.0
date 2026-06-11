'use client';

import { useMemo, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Select,
} from '@/shared/components';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { useCommissions } from '@/modules/accreditation';
import { usePrograms } from '@/modules/academic';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useApiErrorToast } from '@/shared/hooks';
import { tryTranslate } from '@/shared/utils';
import { useI18n } from '@/providers';
import { useAssociateProgramCommission } from '../hooks';

interface AssociateProgramCommissionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	academicPeriodId: number;
}

interface FormState {
	programId: number | null;
	commissionId: number | null;
	commissionTypeId: number | null;
}

interface FormErrors {
	programId?: string;
	commissionId?: string;
	commissionTypeId?: string;
}

const EMPTY_FORM: FormState = {
	programId: null,
	commissionId: null,
	commissionTypeId: null,
};

export default function AssociateProgramCommissionDialog({
	open,
	onOpenChange,
	academicPeriodId,
}: AssociateProgramCommissionDialogProps) {
	const { t, locale } = useI18n();
	const associate = useAssociateProgramCommission();
	const { data: programs, isLoading: programsLoading } = usePrograms({ isActive: true });
	const { data: commissions, isLoading: commissionsLoading } = useCommissions({ isActive: true });
	const { data: commissionTypes, isLoading: commissionTypesLoading } = useTypesByGroupCode(
		TYPE_GROUP_CODES.COMMISSION_TYPE,
	);
	const { showToast } = useApiErrorToast();
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [errors, setErrors] = useState<FormErrors>({});

	const programOptions = useMemo(
		() =>
			(programs ?? []).map((p) => ({
				value: p.id,
				label: `${p.code} — ${p.name[locale] ?? p.code}`,
			})),
		[programs, locale],
	);

	const commissionOptions = useMemo(
		() =>
			(commissions ?? []).map((c) => ({
				value: c.id,
				label: `${c.code} — ${c.name[locale] ?? c.code}`,
			})),
		[commissions, locale],
	);

	const commissionTypeOptions = useMemo(
		() =>
			(commissionTypes ?? []).map((tp) => ({
				value: tp.id,
				label: tp.name[locale] ?? tp.code,
			})),
		[commissionTypes, locale],
	);

	const selectedProgram = programOptions.find((opt) => opt.value === form.programId) ?? null;
	const selectedCommission =
		commissionOptions.find((opt) => opt.value === form.commissionId) ?? null;
	const selectedCommissionType =
		commissionTypeOptions.find((opt) => opt.value === form.commissionTypeId) ?? null;

	const reset = () => {
		setForm(EMPTY_FORM);
		setErrors({});
	};

	const validate = (): FormErrors => {
		const next: FormErrors = {};
		if (!form.programId)
			next.programId = t('admin.configuration.programCommissions.form.error.programRequired');
		if (!form.commissionId)
			next.commissionId = t('admin.configuration.programCommissions.form.error.commissionRequired');
		if (!form.commissionTypeId)
			next.commissionTypeId = t(
				'admin.configuration.programCommissions.form.error.commissionTypeRequired',
			);
		return next;
	};

	const handleSubmit = () => {
		const v = validate();
		setErrors(v);
		if (Object.keys(v).length > 0) return;
		associate.mutate(
			{
				programId: form.programId as number,
				commissionId: form.commissionId as number,
				commissionTypeId: form.commissionTypeId as number,
				academicPeriodId,
			},
			{
				onSuccess: () => {
					reset();
					onOpenChange(false);
				},
				onError: (err) => {
					const raw = err instanceof Error ? err.message : '';
					const translated = raw ? tryTranslate(t, raw) : raw;
					showToast(
						translated && translated !== raw
							? translated
							: t('admin.configuration.programCommissions.form.error.associateFailed'),
						'error',
					);
				},
			},
		);
	};

	const handleOpenChange = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('admin.configuration.programCommissions.form.title')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<Select
						label={t('admin.configuration.programCommissions.form.program')}
						placeholder={
							programsLoading
								? t('loading.default')
								: t('admin.configuration.programCommissions.form.programPlaceholder')
						}
						isDisabled={programsLoading}
						isSearchable
						value={selectedProgram}
						error={errors.programId}
						onChange={(_, opt) => {
							const next = (opt as { value?: number } | null)?.value;
							setForm((f) => ({ ...f, programId: next ?? null }));
						}}
						options={programOptions}
					/>

					<Select
						label={t('admin.configuration.programCommissions.form.commission')}
						placeholder={
							commissionsLoading
								? t('loading.default')
								: t('admin.configuration.programCommissions.form.commissionPlaceholder')
						}
						isDisabled={commissionsLoading}
						isSearchable
						value={selectedCommission}
						error={errors.commissionId}
						onChange={(_, opt) => {
							const next = (opt as { value?: number } | null)?.value;
							setForm((f) => ({ ...f, commissionId: next ?? null }));
						}}
						options={commissionOptions}
					/>

					<Select
						label={t('admin.configuration.programCommissions.form.commissionType')}
						placeholder={
							commissionTypesLoading
								? t('loading.default')
								: t('admin.configuration.programCommissions.form.commissionTypePlaceholder')
						}
						isDisabled={commissionTypesLoading}
						value={selectedCommissionType}
						error={errors.commissionTypeId}
						onChange={(_, opt) => {
							const next = (opt as { value?: number } | null)?.value;
							setForm((f) => ({ ...f, commissionTypeId: next ?? null }));
						}}
						options={commissionTypeOptions}
					/>
				</div>

				<DialogFooter>
					<Button
						variant="secondary"
						onClick={() => handleOpenChange(false)}
						disabled={associate.isPending}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={associate.isPending}>
						{associate.isPending
							? t('admin.configuration.programCommissions.form.submitting')
							: t('admin.configuration.programCommissions.form.submit')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
