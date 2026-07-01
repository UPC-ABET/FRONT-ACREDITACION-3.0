'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ErrorDialog,
	LoadingDialog,
	PageHeader,
	SuccessDialog,
	Toast,
} from '@/shared/components';
import { useGlobalAcademicFiltersLockOverride, useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib';
import { resolveApiErrorContent, tryTranslateReason, type ApiErrorContent } from '@/shared/utils';
import {
	deleteFinding,
	patchFinding,
	useFindingDetail,
	DeleteFindingModal,
	FindingActionsTable,
	FindingGeneralInfo,
} from '@/modules';
import { coreQueryKeys, getParameterByCode } from '@/modules/core';
import { PARAMETER_CODES } from '@/shared';
import type { I18nText } from '@/shared';
import { FINDING_VIEW_LABELS as L } from './findingViewLabels';

export default function FindingDetailPage() {
	const { t, locale: lang } = useI18n();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = Number(params?.id);

	useGlobalAcademicFiltersLockOverride({ school: true, modality: true, period: true });

	const { data, isLoading, error, refetch } = useFindingDetail(id);
	const { data: languages = ['es', 'en'] } = useQuery({
		queryKey: coreQueryKeys.parameterByCode(PARAMETER_CODES.LANGUAGES),
		queryFn: () => getParameterByCode<string[]>(PARAMETER_CODES.LANGUAGES),
		staleTime: Infinity,
	});
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [pendingDelete, setPendingDelete] = useState(false);
	const [actionError, setActionError] = useState<ApiErrorContent | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
		<div className="space-y-6">
			<PageHeader
				title={data.finding.findingCode}
				description={L.pageTitle[lang]}
				action={
					<Button variant="ghost" size="lg" onClick={() => router.push('/ifc-findings')}>
						<ArrowLeftIcon className="h-5 w-5" />
						{L.btnBack[lang]}
					</Button>
				}
			/>

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
