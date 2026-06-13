'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ErrorDialog,
	LoadingDialog,
	SuccessDialog,
	Toast,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import {
	resolveApiErrorContent,
	tryTranslateReason,
	type ApiErrorContent,
} from '@/shared/utils/tryTranslate';
import { useFindingDetail } from '../../hooks/useIfcFindings';
import { deleteFinding, patchFinding } from '../../services/ifcFindingsService';
import { getParameterByCode } from '@/modules/core';
import { PARAMETER_CODES } from '@/shared/constants';
import type { I18nText } from '../../types';
import { DeleteFindingModal } from '../shared/DeleteFindingModal';
import { FindingActionsTable } from './FindingActionsTable';
import { FindingGeneralInfo } from './FindingGeneralInfo';
import { FINDING_VIEW_LABELS as L } from './findingViewLabels';

export default function FindingDetailPage() {
	const { t, locale: lang } = useI18n();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = Number(params?.id);

	const { data, isLoading, error, refetch } = useFindingDetail(id);
	const [languages, setLanguages] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [pendingDelete, setPendingDelete] = useState(false);
	const [actionError, setActionError] = useState<ApiErrorContent | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		getParameterByCode<string[]>(PARAMETER_CODES.LANGUAGES)
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
			setActionError(resolveApiErrorContent(t, e, 'ifcFindings.error.patchFailed'));
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
			setActionError(resolveApiErrorContent(t, e, 'ifcFindings.error.deleteFailed'));
		} finally {
			setDeleting(false);
		}
	}

	if (isLoading) {
		return <LoadingDialog isOpen label={t('loading.default')} />;
	}

	if (error || !data) {
		return (
			<ErrorDialog
				isOpen
				onClose={() => router.push('/ifc-findings')}
				message={tryTranslateReason(t, getErrorMessage(error, 'ifcFindings.error.viewFailed'))}
			/>
		);
	}

	return (
		<div className="w-full space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-1.5">
					<p className="text-sm font-semibold uppercase tracking-wider text-red-700">
						{L.pageTitle[lang]}
					</p>
					<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
						{data.finding.findingCode}
					</h1>
				</div>
				<Button variant="ghost" size="lg" onClick={() => router.push('/ifc-findings')}>
					<ArrowLeftIcon className="h-5 w-5" />
					{L.btnBack[lang]}
				</Button>
			</div>

			<FindingGeneralInfo
				finding={data.finding}
				languages={languages}
				saving={saving}
				onSave={handleSave}
				onDelete={() => setPendingDelete(true)}
				onValidationError={(key) =>
					setActionError({ title: tryTranslateReason(t, key), reasons: [] })
				}
			/>

			<Card title={L.sectionActions[lang]}>
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
				<Toast
					isOpen
					type="error"
					onClose={() => setActionError(null)}
					message={actionError.title}
					reasons={actionError.reasons}
				/>
			)}
			{successMsg && (
				<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
			)}
		</div>
	);
}
