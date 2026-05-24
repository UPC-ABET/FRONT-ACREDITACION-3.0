'use client';

import React, { useEffect, useState } from 'react';
import { Select, Tabs, Toast } from '@/shared/components';
import { useGRACompetences, useGRACycles, usePPPAcceptanceLevels } from '../../../hooks';
import { useABET } from '@/providers';
import { CompetenceCRUD } from '../../shared/CompetenceCRUD';
import { AcceptanceLevels } from '../../ppp/configuration/AcceptanceLevels';

const TABS = [
	{ id: 'competences', label: 'Competencias' },
	{ id: 'levels', label: 'Niveles de Aceptación' },
];

export function GRAConfiguration() {
	const { modalityTypeId } = useABET();
	const { cycles, load: loadCycles } = useGRACycles();
	const {
		competences,
		loading: compLoading,
		error: compError,
		load: loadComp,
		save: saveComp,
		remove: removeComp,
		clone: cloneComp,
	} = useGRACompetences();
	const levelsHook = usePPPAcceptanceLevels();

	const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null);
	const [activeTab, setActiveTab] = useState('competences');
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		loadCycles(modalityTypeId);
	}, [modalityTypeId, loadCycles]);

	useEffect(() => {
		if (!selectedCycle) return;
		loadComp(selectedCycle.value);
		levelsHook.load(selectedCycle.value);
	}, [selectedCycle]); // eslint-disable-line react-hooks/exhaustive-deps

	const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }));

	return (
		<div className="space-y-6">
			<div className="max-w-sm">
				<Select
					label="Ciclo Académico"
					options={cycleOptions}
					value={selectedCycle}
					onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
					placeholder="Selecciona un ciclo"
					isSearchable
				/>
			</div>

			{selectedCycle && (
				<>
					<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

					<div className="pt-2">
						{activeTab === 'competences' && (
							<CompetenceCRUD
								cycleId={selectedCycle.value}
								competences={competences}
								loading={compLoading}
								error={compError}
								onLoad={loadComp}
								onSave={saveComp}
								onDelete={removeComp}
								onClone={cloneComp}
							/>
						)}

						{activeTab === 'levels' && (
							<AcceptanceLevels
								cycleId={selectedCycle.value}
								levels={levelsHook.levels}
								setLevels={levelsHook.setLevels}
								loading={levelsHook.loading}
								error={levelsHook.error}
								onLoad={levelsHook.load}
								onSave={levelsHook.save}
							/>
						)}
					</div>
				</>
			)}

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
