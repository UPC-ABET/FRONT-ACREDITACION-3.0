'use client';

import { useMemo, useState } from 'react';
import {
	ExclamationTriangleIcon,
	TrashIcon,
	UserGroupIcon,
	UsersIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/apiError';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import { useNotificationConfigContext } from '../hooks/useNotificationConfigContext';
import {
	deleteNotificationConfig,
	upsertNotificationConfig,
} from '../services/notificationConfigsService';
import type { NotificationConfig, UpsertConfigBody } from '../types';
import { TemplateFields } from './TemplateFields';
import { ActiveToggle, EditorActions, EditorCard, FormSection } from './shared';

type Props = {
	triggerTypeId: number;
	statusTypeId: number;
	statusCode: string;
	existingConfig: NotificationConfig | null;
};

function emptyI18n(): I18nText {
	return { es: '', en: '' };
}

function asI18n(text: I18nText | undefined | null): I18nText {
	return { es: text?.es ?? '', en: text?.en ?? '' };
}

type RecipientOption = { id: number; label: string };

function RecipientsField({
	icon,
	label,
	options,
	selected,
	onToggle,
	emptyLabel,
}: {
	icon: React.ReactNode;
	label: string;
	options: RecipientOption[];
	selected: number[];
	onToggle: (id: number) => void;
	emptyLabel: string;
}) {
	return (
		<div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
			<div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/60 px-5 py-3">
				<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-700">
					{icon}
					{label}
				</div>
				{selected.length > 0 && (
					<span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-100 px-2 text-xs font-bold text-red-700">
						{selected.length}
					</span>
				)}
			</div>
			<div className="space-y-1 p-4">
				{options.length === 0 ? (
					<p className="px-1 py-2 text-sm italic text-zinc-500">{emptyLabel}</p>
				) : (
					options.map((opt) => {
						const checked = selected.includes(opt.id);
						return (
							<label
								key={opt.id}
								className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-base transition-colors ${
									checked ? 'bg-red-50 text-red-900' : 'hover:bg-zinc-50'
								}`}>
								<input
									type="checkbox"
									className="h-5 w-5 cursor-pointer rounded border-zinc-300 accent-red-600"
									checked={checked}
									onChange={() => onToggle(opt.id)}
								/>
								<span>{opt.label}</span>
							</label>
						);
					})
				)}
			</div>
		</div>
	);
}

export function ConfigEditor({ triggerTypeId, statusTypeId, statusCode, existingConfig }: Props) {
	const { t, locale: lang } = useI18n();
	const { periodId, chartEntityTypes, notifyVars, onSaved, onError, onSuccess } =
		useNotificationConfigContext();
	const [name, setName] = useState<I18nText>(() =>
		existingConfig ? asI18n(existingConfig.name) : emptyI18n(),
	);
	const [subject, setSubject] = useState<I18nText>(() =>
		existingConfig ? asI18n(existingConfig.subject) : emptyI18n(),
	);
	const [body, setBody] = useState<I18nText>(() =>
		existingConfig ? asI18n(existingConfig.body) : emptyI18n(),
	);
	const [toIds, setToIds] = useState<number[]>(() => existingConfig?.toChartEntityTypeIds ?? []);
	const [ccIds, setCcIds] = useState<number[]>(() => existingConfig?.ccChartEntityTypeIds ?? []);
	const [isActive, setIsActive] = useState<boolean>(() => existingConfig?.isActive ?? true);
	const [saving, setSaving] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const chartEntityTypeOptions = useMemo<RecipientOption[]>(
		() =>
			chartEntityTypes.map((c) => ({
				id: Number(c.id),
				label: c.name?.[lang] ?? c.name?.es ?? c.code,
			})),
		[chartEntityTypes, lang],
	);

	function toggleIdInList(list: number[], id: number): number[] {
		return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
	}

	async function handleSave() {
		setSaving(true);
		try {
			const payload: UpsertConfigBody = {
				academicPeriodId: periodId,
				triggerTypeId: triggerTypeId,
				ifcStatusTypeId: statusTypeId,
				name,
				subject,
				body,
				toChartEntityTypeIds: toIds,
				ccChartEntityTypeIds: ccIds,
				isActive: isActive,
			};
			await upsertNotificationConfig(payload);
			onSuccess(t('admin.notify.toast.saved'));
			onSaved();
		} catch (e) {
			onError(getErrorMessage(e, 'admin.notify.error.saveFailed'));
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!existingConfig) return;
		setSaving(true);
		try {
			await deleteNotificationConfig(existingConfig.id);
			onSuccess(t('admin.notify.toast.deleted'));
			onSaved();
		} catch (e) {
			onError(getErrorMessage(e, 'admin.notify.error.deleteFailed'));
		} finally {
			setSaving(false);
			setConfirmDelete(false);
		}
	}

	return (
		<div className="space-y-5">
			<EditorCard>
				<TemplateFields
					name={name}
					subject={subject}
					body={body}
					onName={setName}
					onSubject={setSubject}
					onBody={setBody}
					notifyVars={notifyVars}
					statusCode={statusCode}
					disabled={saving}
				/>

				<FormSection title={`${t('admin.notify.field.to')} / ${t('admin.notify.field.cc')}`}>
					<div className="grid gap-5 md:grid-cols-2">
						<RecipientsField
							icon={<UsersIcon className="h-5 w-5 text-red-700" />}
							label={t('admin.notify.field.to')}
							options={chartEntityTypeOptions}
							selected={toIds}
							onToggle={(id) => setToIds((prev) => toggleIdInList(prev, id))}
							emptyLabel={t('admin.notify.field.noEntityTypes')}
						/>
						<RecipientsField
							icon={<UserGroupIcon className="h-5 w-5 text-red-700" />}
							label={t('admin.notify.field.cc')}
							options={chartEntityTypeOptions}
							selected={ccIds}
							onToggle={(id) => setCcIds((prev) => toggleIdInList(prev, id))}
							emptyLabel={t('admin.notify.field.noEntityTypes')}
						/>
					</div>
				</FormSection>
			</EditorCard>

			<EditorActions left={<ActiveToggle checked={isActive} onChange={setIsActive} />}>
				{existingConfig && !confirmDelete && (
					<Button
						variant="ghost"
						disabled={saving}
						onClick={() => setConfirmDelete(true)}
						className="text-red-700 hover:bg-red-50">
						<TrashIcon className="h-5 w-5" />
						{t('admin.notify.btn.delete')}
					</Button>
				)}
				{existingConfig && confirmDelete && (
					<div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3">
						<ExclamationTriangleIcon className="h-5 w-5 text-red-700" />
						<span className="text-sm font-medium text-red-800">
							{t('admin.notify.confirm.delete')}
						</span>
						<Button
							variant="ghost"
							size="md"
							disabled={saving}
							onClick={() => setConfirmDelete(false)}>
							{t('dialog.actions.cancel')}
						</Button>
						<Button variant="primary" size="md" disabled={saving} onClick={handleDelete}>
							{t('admin.notify.btn.confirmDelete')}
						</Button>
					</div>
				)}
				<Button variant="primary" disabled={saving} onClick={handleSave} loading={saving}>
					{t('admin.notify.btn.save')}
				</Button>
			</EditorActions>
		</div>
	);
}
