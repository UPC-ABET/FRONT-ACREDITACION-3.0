'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, HashtagIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { validatePrefixValue } from '../schemas';
import { updateParameter } from '../services/parametersAdminService';
import type { ParameterRow } from '../types';

type Props = {
	parameter: ParameterRow<string>;
	onSaved: (updated: ParameterRow<string>) => void;
	onError: (msg: string) => void;
	onSuccess: (msg: string) => void;
};

export function PrefixParameterCard({ parameter, onSaved, onError, onSuccess }: Props) {
	const { t, locale: lang } = useI18n();
	const initialValue = parameter.value ?? '';
	const [value, setValue] = useState(initialValue);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setValue(parameter.value ?? '');
	}, [parameter.value]);

	const dirty = value.trim() !== initialValue.trim();
	const validationError = !validatePrefixValue(value);

	async function handleSave() {
		if (!dirty || validationError) return;
		setSaving(true);
		try {
			const updated = await updateParameter<string>(parameter.id, { value: value.trim() });
			onSuccess(t('admin.params.toast.saved'));
			onSaved(updated);
		} catch (e) {
			onError(getErrorMessage(e, 'admin.params.error.saveFailed'));
		} finally {
			setSaving(false);
		}
	}

	function handleReset() {
		setValue(initialValue);
	}

	const name = parameter.name?.[lang] ?? parameter.name?.es ?? parameter.code;
	const description = parameter.description?.[lang] ?? parameter.description?.es ?? '';

	return (
		<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
			<div className="flex items-start gap-4 border-b border-zinc-100 bg-zinc-50/60 px-6 py-5">
				<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
					<HashtagIcon className="h-6 w-6" aria-hidden="true" />
				</div>
				<div className="flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-base font-bold text-zinc-900">{name}</h3>
						<code className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono text-zinc-600">
							{parameter.code}
						</code>
					</div>
					{description && (
						<p className="mt-1 text-sm text-zinc-500 leading-relaxed">{description}</p>
					)}
				</div>
			</div>

			<div className="grid gap-5 px-6 py-6 md:grid-cols-[1fr_auto] md:items-end">
				<div className="space-y-2">
					<Input
						label={t('admin.params.field.value')}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder={t('admin.params.field.valuePlaceholder')}
						maxLength={32}
						aria-invalid={validationError}
					/>
					<p className="flex items-center gap-2 text-xs text-zinc-500">
						<CheckCircleIcon className="h-4 w-4 text-zinc-400" aria-hidden="true" />
						{t('admin.params.field.prefixHint')}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 md:justify-end">
					{dirty && (
						<Button variant="ghost" size="lg" disabled={saving} onClick={handleReset}>
							{t('admin.params.btn.reset')}
						</Button>
					)}
					<Button
						variant="primary"
						size="lg"
						disabled={!dirty || validationError || saving}
						onClick={handleSave}
						loading={saving}>
						{t('admin.params.btn.save')}
					</Button>
				</div>
			</div>
		</div>
	);
}
