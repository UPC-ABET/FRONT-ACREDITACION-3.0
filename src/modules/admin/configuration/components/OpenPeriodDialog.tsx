'use client';

import { useMemo, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Select,
} from '@/shared/components';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useApiErrorToast } from '@/shared/hooks';
import { tryTranslate } from '@/shared/utils';
import { useI18n } from '@/providers';
import { useCreatePeriod } from '../hooks';
import { isValidPeriodCode } from '../schemas';

interface OpenPeriodDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface FormState {
	code: string;
	startDate: string;
	endDate: string;
	modalityTypeId: number | null;
}

interface FormErrors {
	code?: string;
	startDate?: string;
	endDate?: string;
	modalityTypeId?: string;
}

const EMPTY_FORM: FormState = {
	code: '',
	startDate: '',
	endDate: '',
	modalityTypeId: null,
};

export default function OpenPeriodDialog({ open, onOpenChange }: OpenPeriodDialogProps) {
	const { t, locale } = useI18n();
	const createPeriod = useCreatePeriod();
	const { data: modalities, isLoading: modalitiesLoading } = useTypesByGroupCode(
		TYPE_GROUP_CODES.PROGRAM_MODALITY,
	);
	const { showToast } = useApiErrorToast();
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [errors, setErrors] = useState<FormErrors>({});

	const modalityOptions = useMemo(
		() =>
			(modalities ?? []).map((type) => ({
				value: type.id,
				label: type.name[locale] ?? type.code,
			})),
		[modalities, locale],
	);

	const selectedModality = modalityOptions.find((opt) => opt.value === form.modalityTypeId) ?? null;

	const reset = () => {
		setForm(EMPTY_FORM);
		setErrors({});
	};

	const validate = (): FormErrors => {
		const next: FormErrors = {};
		if (!form.code.trim()) next.code = t('admin.configuration.periods.form.error.codeRequired');
		else if (!isValidPeriodCode(form.code.trim()))
			next.code = t('admin.configuration.periods.form.error.codeInvalid');
		if (!form.startDate)
			next.startDate = t('admin.configuration.periods.form.error.startDateRequired');
		if (!form.endDate) next.endDate = t('admin.configuration.periods.form.error.endDateRequired');
		if (form.startDate && form.endDate && form.endDate < form.startDate)
			next.endDate = t('admin.configuration.periods.form.error.endBeforeStart');
		if (!form.modalityTypeId)
			next.modalityTypeId = t('admin.configuration.periods.form.error.modalityRequired');
		return next;
	};

	const handleSubmit = () => {
		const v = validate();
		setErrors(v);
		if (Object.keys(v).length > 0) return;
		createPeriod.mutate(
			{
				code: form.code.trim(),
				startDate: form.startDate,
				endDate: form.endDate,
				modalityTypeId: form.modalityTypeId as number,
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
							: t('admin.configuration.periods.form.error.createFailed'),
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
					<DialogTitle>{t('admin.configuration.periods.form.title')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						label={t('admin.configuration.periods.form.code')}
						placeholder="2026-01"
						value={form.code}
						onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
						error={errors.code}
						helperText={t('admin.configuration.periods.form.codeHelp')}
						required
					/>

					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							type="date"
							label={t('admin.configuration.periods.form.startDate')}
							value={form.startDate}
							onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
							error={errors.startDate}
							required
						/>
						<Input
							type="date"
							label={t('admin.configuration.periods.form.endDate')}
							value={form.endDate}
							onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
							error={errors.endDate}
							required
						/>
					</div>

					<Select
						label={t('admin.configuration.periods.form.modality')}
						placeholder={
							modalitiesLoading
								? t('loading.default')
								: t('admin.configuration.periods.form.modalityPlaceholder')
						}
						isDisabled={modalitiesLoading}
						value={selectedModality}
						error={errors.modalityTypeId}
						onChange={(_, opt) => {
							const next = (opt as { value?: number } | null)?.value;
							setForm((f) => ({ ...f, modalityTypeId: next ?? null }));
						}}
						options={modalityOptions}
					/>
				</div>

				<DialogFooter>
					<Button
						variant="secondary"
						onClick={() => handleOpenChange(false)}
						disabled={createPeriod.isPending}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={createPeriod.isPending}>
						{createPeriod.isPending
							? t('admin.configuration.periods.form.submitting')
							: t('admin.configuration.periods.form.submit')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
