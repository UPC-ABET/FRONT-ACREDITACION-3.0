'use client';

import React, { useState } from 'react';
import { Tabs } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { AddStudentPanel } from './AddStudentPanel';
import { StudentList } from './StudentList';
import { EditEmailTemplate } from './EditEmailTemplate';
import { FileUploadPanel } from '../../shared/FileUploadPanel';
import { UploadResultSummary } from '../../shared/UploadResultSummary';
import { useGRAUpload } from '../../../hooks';

export function GRANotificationView() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [activeTab, setActiveTab] = useState('list');
	const { loading, error, success, result, downloadTemplate, upload } = useGRAUpload();

	const NOTIFICATION_TABS = [
		{ id: 'list', label: t('surveys.gra.notifications.tabs.list') },
		{ id: 'add', label: t('surveys.gra.notifications.tabs.add') },
		{ id: 'upload', label: t('surveys.gra.notifications.tabs.upload') },
		{ id: 'email', label: t('surveys.gra.notifications.tabs.email') },
	];

	const periodId = academicPeriodId ?? 0;
	const programId = 0;

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<Tabs tabs={NOTIFICATION_TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'list' && <StudentList programId={programId} academicPeriodId={periodId} />}

				{activeTab === 'add' && (
					<AddStudentPanel
						programId={programId}
						academicPeriodId={periodId}
						onStudentAdded={() => setActiveTab('list')}
					/>
				)}

				{activeTab === 'upload' && (
					<div className="max-w-lg space-y-4">
						<FileUploadPanel
							title={t('surveys.gra.notifications.uploadTitle')}
							description={t('surveys.gra.notifications.uploadDesc')}
							uploading={loading}
							success={success}
							error={error}
							onUpload={(file) => upload(file, { programId, academicPeriodId: periodId })}
							onDownloadTemplate={() => downloadTemplate()}
							downloadLabel={t('surveys.gra.notifications.downloadLabel')}
						/>
						{result && <UploadResultSummary result={result} />}
					</div>
				)}

				{activeTab === 'email' && (
					<div className="max-w-lg">
						<EditEmailTemplate surveyId={periodId} />
					</div>
				)}
			</div>
		</div>
	);
}
