'use client';

import { useEffect, useMemo, useState } from 'react';
import {
	ExclamationTriangleIcon,
	InboxIcon,
	PlusIcon,
	ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	ErrorDialog,
	LoadingDialog,
	SuccessDialog,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { useParameter } from '../hooks/useParameter';
import { updateParameter } from '../services/parametersAdminService';
import { PARAM_CODES, type IFCFieldDescriptor } from '../services/types';
import { IfcFieldEditor } from './IfcFieldEditor';

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

function cloneFields(fields: IFCFieldDescriptor[]): IFCFieldDescriptor[] {
	return fields.map((f) => ({
		key: f.key,
		label: { es: f.label?.es ?? '', en: f.label?.en ?? '' },
		required: Boolean(f.required),
		order: Number(f.order ?? 0),
	}));
}

function emptyField(order: number): IFCFieldDescriptor {
	return { key: '', label: { es: '', en: '' }, required: false, order };
}

function sameFields(a: IFCFieldDescriptor[], b: IFCFieldDescriptor[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		const x = a[i];
		const y = b[i];
		if (
			x.key !== y.key ||
			x.required !== y.required ||
			x.order !== y.order ||
			(x.label.es ?? '') !== (y.label.es ?? '') ||
			(x.label.en ?? '') !== (y.label.en ?? '')
		) {
			return false;
		}
	}
	return true;
}

export function IfcFieldsPage() {
	const { t } = useI18n();
	const { data, loading, error, refetch, setData } = useParameter<IFCFieldDescriptor[]>(
		PARAM_CODES.IFC_FIELDS,
	);

	const [fields, setFields] = useState<IFCFieldDescriptor[]>([]);
	const [original, setOriginal] = useState<IFCFieldDescriptor[]>([]);
	const [saving, setSaving] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
	const [showValidation, setShowValidation] = useState(false);

	useEffect(() => {
		if (!data) return;
		const value = Array.isArray(data.value) ? data.value : [];
		const sorted = cloneFields(value).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync local form with loaded data
		setFields(sorted);
		setOriginal(sorted);
		setShowValidation(false);
	}, [data]);

	const duplicateKeys = useMemo(() => {
		const counts = new Map<string, number>();
		for (const f of fields) {
			const k = f.key.trim();
			if (!k) continue;
			counts.set(k, (counts.get(k) ?? 0) + 1);
		}
		return new Set(
			Array.from(counts.entries())
				.filter(([, count]) => count > 1)
				.map(([key]) => key),
		);
	}, [fields]);

	const validationByIndex = useMemo(() => {
		return fields.map((f) => ({
			keyMissing: f.key.trim().length === 0,
			keyDuplicate: f.key.trim().length > 0 && duplicateKeys.has(f.key.trim()),
			esMissing: (f.label.es ?? '').trim().length === 0,
			enMissing: (f.label.en ?? '').trim().length === 0,
		}));
	}, [fields, duplicateKeys]);

	const hasErrors = validationByIndex.some(
		(v) => v.keyMissing || v.keyDuplicate || v.esMissing || v.enMissing,
	);

	const dirty = !sameFields(fields, original);

	function updateField(index: number, next: IFCFieldDescriptor) {
		setFields((prev) => prev.map((f, i) => (i === index ? next : f)));
	}

	function addField() {
		setFields((prev) => [...prev, emptyField(prev.length + 1)]);
	}

	function moveField(index: number, direction: -1 | 1) {
		setFields((prev) => {
			const target = index + direction;
			if (target < 0 || target >= prev.length) return prev;
			const next = [...prev];
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});
	}

	function confirmDelete(index: number) {
		setDeleteIndex(index);
	}

	function applyDelete() {
		if (deleteIndex === null) return;
		setFields((prev) => prev.filter((_, i) => i !== deleteIndex));
		setDeleteIndex(null);
	}

	function discardChanges() {
		setFields(cloneFields(original));
		setShowValidation(false);
	}

	async function handleSave() {
		setShowValidation(true);
		if (hasErrors) {
			setErrorMsg('admin.params.fields.err.fixBeforeSave');
			return;
		}
		if (!data) return;

		const payloadValue = fields.map((f, i) => ({
			key: f.key.trim(),
			label: {
				es: (f.label.es ?? '').trim(),
				en: (f.label.en ?? '').trim(),
			},
			required: Boolean(f.required),
			order: i + 1,
		}));

		setSaving(true);
		try {
			const updated = await updateParameter<IFCFieldDescriptor[]>(data.id, {
				value: payloadValue,
			});
			setData(updated);
			setSuccessMsg(t('admin.params.toast.saved'));
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'admin.params.error.saveFailed';
			setErrorMsg(msg);
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card title={t('admin.params.fields.page.title')}>
			<div className="space-y-6">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:p-6">
					<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
						{t('admin.params.fields.page.subtitle')}
					</h2>
					<p className="mt-1 max-w-3xl text-sm text-zinc-500 leading-relaxed">
						{t('admin.params.fields.page.intro')}
					</p>
				</div>

				{loading && <LoadingDialog isOpen label={t('loading.default')} />}

				{!loading && error && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-base text-red-800">
						<ExclamationTriangleIcon
							className="h-6 w-6 flex-shrink-0 text-red-600"
							aria-hidden="true"
						/>
						<div className="flex-1">
							<p>{tryTranslate(t, error)}</p>
							<Button
								variant="ghost"
								size="sm"
								className="mt-2 text-red-700 hover:bg-red-100"
								onClick={() => void refetch()}>
								{t('admin.params.btn.retry')}
							</Button>
						</div>
					</div>
				)}

				{!loading && !error && (
					<>
						{fields.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-zinc-500">
								<InboxIcon className="h-12 w-12 text-zinc-400" aria-hidden="true" />
								<p className="text-base italic">{t('admin.params.fields.empty')}</p>
								<Button variant="primary" size="lg" onClick={addField}>
									<PlusIcon className="h-5 w-5" />
									{t('admin.params.fields.btn.add')}
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{fields.map((field, index) => {
									const v = validationByIndex[index];
									return (
										<IfcFieldEditor
											key={`field-${index}`}
											field={field}
											index={index}
											total={fields.length}
											keyError={showValidation && v?.keyMissing}
											keyDuplicate={showValidation && v?.keyDuplicate}
											esError={showValidation && v?.esMissing}
											enError={showValidation && v?.enMissing}
											onChange={(next) => updateField(index, next)}
											onMoveUp={() => moveField(index, -1)}
											onMoveDown={() => moveField(index, 1)}
											onDelete={() => confirmDelete(index)}
										/>
									);
								})}

								<div className="flex justify-center">
									<Button variant="secondary" size="lg" onClick={addField}>
										<PlusIcon className="h-5 w-5" />
										{t('admin.params.fields.btn.add')}
									</Button>
								</div>
							</div>
						)}

						<div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse items-stretch gap-3 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur sm:relative sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
							<p className="text-xs text-zinc-500">
								{dirty
									? t('admin.params.fields.unsaved')
									: t('admin.params.fields.allSaved')}
							</p>
							<div className="flex flex-wrap items-center gap-2 sm:justify-end">
								{dirty && (
									<Button
										variant="ghost"
										size="lg"
										disabled={saving}
										onClick={discardChanges}>
										<ArrowUturnLeftIcon className="h-5 w-5" />
										{t('admin.params.btn.discard')}
									</Button>
								)}
								<Button
									variant="primary"
									size="lg"
									disabled={!dirty || saving}
									onClick={handleSave}>
									{saving ? t('loading.default') : t('admin.params.btn.save')}
								</Button>
							</div>
						</div>
					</>
				)}

				{errorMsg && (
					<ErrorDialog
						isOpen
						onClose={() => setErrorMsg(null)}
						message={tryTranslate(t, errorMsg)}
					/>
				)}

				{successMsg && (
					<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
				)}

				<ConfirmDialog
					isOpen={deleteIndex !== null}
					onClose={() => setDeleteIndex(null)}
					title={t('admin.params.fields.confirmDelete.title')}
					message={t('admin.params.fields.confirmDelete.body')}
					confirmLabel={t('admin.params.fields.confirmDelete.confirm')}
					declineLabel={t('dialog.actions.cancel')}
					onConfirm={applyDelete}
					onDecline={() => setDeleteIndex(null)}
				/>
			</div>
		</Card>
	);
}
