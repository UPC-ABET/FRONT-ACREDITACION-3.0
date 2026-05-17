'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, ErrorDialog, LoadingDialog, SuccessDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { useFindingDetail } from '../../hooks/useFindingDetail';
import { deleteFinding, patchFinding } from '../../services/ifcFindingsService';
import { getParameterByCode } from '../../services/parametersService';
import type { I18nText } from '../../services/types';
import { DeleteFindingModal } from '../shared/DeleteFindingModal';
import { FindingActionsTable } from './FindingActionsTable';
import { FindingGeneralInfo } from './FindingGeneralInfo';
import { FINDING_VIEW_LABELS as L } from './findingViewLabels';

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

export default function FindingDetailPage() {
	const { t, locale: lang } = useI18n();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = Number(params?.id);

	const { data, loading, error, refetch } = useFindingDetail(id);
	const [languages, setLanguages] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [pendingDelete, setPendingDelete] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		getParameterByCode<string[]>('PARAMETER_LANGUAGES')
			.then((langs) => {
				if (alive) setLanguages(langs);
			})
			.catch(() => {
				if (alive) setLanguages(['es', 'en']);
			});
		return () => {
			alive = false;
		};
	}, []);

	async function handleSave(description: I18nText) {
		setSaving(true);
		setActionError(null);
		try {
			await patchFinding(id, { description });
			setSuccessMsg(t('ifcFindings.findingView.toast.saved'));
			await refetch();
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcFindings.error.patchFailed';
			setActionError(message);
			throw e;
		} finally {
			setSaving(false);
		}
	}

	async function handleConfirmDelete() {
		setDeleting(true);
		setActionError(null);
		try {
			await deleteFinding(id);
			setPendingDelete(false);
			router.push('/ifc-findings');
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcFindings.error.deleteFailed';
			setActionError(message);
		} finally {
			setDeleting(false);
		}
	}

	if (loading) {
		return <LoadingDialog isOpen label={t('loading.default')} />;
	}

	if (error || !data) {
		return (
			<ErrorDialog
				isOpen
				onClose={() => router.push('/ifc-findings')}
				message={tryTranslate(t, error ?? 'ifcFindings.error.viewFailed')}
			/>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-zinc-800">{L.page_title[lang]}</h1>
				<Button
					variant="ghost"
					size="md"
					onClick={() => router.push('/ifc-findings')}>
					{L.btn_back[lang]}
				</Button>
			</div>

			<FindingGeneralInfo
				finding={data.finding}
				languages={languages}
				saving={saving}
				onSave={handleSave}
				onDelete={() => setPendingDelete(true)}
				onValidationError={setActionError}
			/>

			<Card title={L.section_actions[lang]}>
				<FindingActionsTable actions={data.actions} />
			</Card>

			<DeleteFindingModal
				target={pendingDelete ? { id: data.finding.id } : null}
				submitting={deleting}
				onConfirm={handleConfirmDelete}
				onClose={() => setPendingDelete(false)}
			/>

			{(saving || deleting) && <LoadingDialog isOpen label={t('loading.default')} />}
			{actionError && (
				<ErrorDialog
					isOpen
					onClose={() => setActionError(null)}
					message={tryTranslate(t, actionError)}
				/>
			)}
			{successMsg && (
				<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
			)}
		</div>
	);
}
