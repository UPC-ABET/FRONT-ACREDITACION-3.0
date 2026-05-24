'use client';

import React, { useEffect, useState } from 'react';
import { Select, Button, Input, Toast } from '@/shared/components';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useLCFCNotification, useLCFCCycles } from '../../../hooks';
import { useABET } from '@/providers';

export function LCFCNotificationView() {
	const { modalityTypeId } = useABET();
	const { cycles, load: loadCycles } = useLCFCCycles();
	const { sending, error: sendError, send } = useLCFCNotification();

	const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null);
	const [surveyBaseUrl, setSurveyBaseUrl] = useState('');
	const [maxRegisterDate, setMaxRegisterDate] = useState('');
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		loadCycles(modalityTypeId);
	}, [modalityTypeId, loadCycles]);
	useEffect(() => {
		if (sendError) setToast({ open: true, type: 'error', msg: sendError });
	}, [sendError]);

	function handleSend() {
		if (!selectedCycle || !surveyBaseUrl.trim() || !maxRegisterDate) {
			setToast({ open: true, type: 'error', msg: 'Completa todos los campos antes de enviar.' });
			return;
		}
		send(
			{
				academic_period_id: selectedCycle.value,
				program_id: 0,
				max_register_date: new Date(maxRegisterDate).toISOString(),
				survey_base_url: surveyBaseUrl.trim(),
			},
			() => setToast({ open: true, type: 'success', msg: 'Notificaciones enviadas exitosamente.' }),
		);
	}

	const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }));
	const canSend = !!selectedCycle && !!surveyBaseUrl.trim() && !!maxRegisterDate && !sending;

	return (
		<div className="max-w-lg space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">Envío de Notificaciones LCFC</h3>
				<p className="text-sm text-zinc-500 mt-1">
					Configura el período y la URL base de la encuesta. El sistema enviará el correo a todos
					los estudiantes del período seleccionado.
				</p>
			</div>

			<div className="space-y-4">
				<Select
					label="Ciclo / Período académico"
					options={cycleOptions}
					value={selectedCycle}
					onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
					placeholder="Selecciona un período"
					isSearchable
				/>

				<Input
					label="URL base de la encuesta"
					value={surveyBaseUrl}
					onChange={(e) => setSurveyBaseUrl(e.target.value)}
					placeholder="https://tu-dominio.com/encuesta/lcfc"
					type="url"
				/>

				<Input
					label="Fecha límite de registro"
					value={maxRegisterDate}
					onChange={(e) => setMaxRegisterDate(e.target.value)}
					type="date"
				/>
			</div>

			<Button onClick={handleSend} disabled={!canSend}>
				<PaperAirplaneIcon className="h-4 w-4 mr-2" />
				{sending ? 'Enviando...' : 'Enviar Notificaciones'}
			</Button>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
