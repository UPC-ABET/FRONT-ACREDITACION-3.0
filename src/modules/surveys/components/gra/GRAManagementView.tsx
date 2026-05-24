'use client';

import React, { useState } from 'react';
import { Tabs } from '@/shared/components';
import { GRAReports } from './GRAReports';
import { GRANotificationView } from './notifications/GRANotificationView';
import { GRAConfiguration } from './configuration/GRAConfiguration';

const TABS = [
	{ id: 'reports', label: 'Reportes' },
	{ id: 'notifications', label: 'Notificaciones' },
	{ id: 'config', label: 'Configuración' },
];

export function GRAManagementView() {
	const [activeTab, setActiveTab] = useState('reports');

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-zinc-900">GRA — Encuestas de Graduandos</h1>
				<p className="text-sm text-zinc-500 mt-1">
					Gestión de encuestas para estudiantes próximos a graduarse
				</p>
			</div>

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'reports' && <GRAReports />}
				{activeTab === 'notifications' && <GRANotificationView />}
				{activeTab === 'config' && <GRAConfiguration />}
			</div>
		</div>
	);
}
