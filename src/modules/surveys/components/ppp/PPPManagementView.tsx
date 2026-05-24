'use client';

import React, { useState } from 'react';
import { Tabs } from '@/shared/components';
import { PPPDownloadTemplate } from './PPPDownloadTemplate';
import { PPPMassiveUpload } from './PPPMassiveUpload';
import { PPPReports } from './PPPReports';
import { PPPConfiguration } from './configuration/PPPConfiguration';

const TABS = [
	{ id: 'download', label: 'Descargar Plantilla' },
	{ id: 'upload', label: 'Carga Masiva' },
	{ id: 'reports', label: 'Reportes' },
	{ id: 'config', label: 'Configuración' },
];

export function PPPManagementView() {
	const [activeTab, setActiveTab] = useState('download');

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-zinc-900">PPP — Prácticas Pre-Profesionales</h1>
				<p className="text-sm text-zinc-500 mt-1">
					Gestión de encuestas de Prácticas Pre-Profesionales
				</p>
			</div>

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'download' && <PPPDownloadTemplate />}
				{activeTab === 'upload' && <PPPMassiveUpload />}
				{activeTab === 'reports' && <PPPReports />}
				{activeTab === 'config' && <PPPConfiguration />}
			</div>
		</div>
	);
}
