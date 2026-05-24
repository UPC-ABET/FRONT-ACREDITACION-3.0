'use client';

import React, { useState } from 'react';
import { Button, TextArea, Toast } from '@/shared/components';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { SurveyCommissionGroup, SurveyTokenVerification } from '../../types';

interface SurveyFormProps {
	verification: SurveyTokenVerification;
	outcomes: SurveyCommissionGroup[];
	submitting: boolean;
	error: string | null;
	onScoreChange: (comisionId: number, outcomeId: number, puntaje: number) => void;
	onSubmit: (comentario: string) => void;
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5];
const SCORE_LABELS: Record<number, string> = {
	1: 'Insuficiente',
	2: 'Regular',
	3: 'Bueno',
	4: 'Muy Bueno',
	5: 'Excelente',
};

export function SurveyForm({
	verification,
	outcomes,
	submitting,
	error,
	onScoreChange,
	onSubmit,
}: SurveyFormProps) {
	const [comentario, setComentario] = useState('');
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	function handleSubmit() {
		const allAnswered = outcomes.every((g) => g.outcomes.every((o) => o.desempeno !== null));
		if (!allAnswered) {
			setToast({
				open: true,
				type: 'error',
				msg: 'Por favor, completa todos los outcomes antes de enviar.',
			});
			return;
		}
		if (!comentario.trim()) {
			setToast({ open: true, type: 'error', msg: 'El comentario es obligatorio.' });
			return;
		}
		onSubmit(comentario);
	}

	const totalOutcomes = outcomes.reduce((acc, g) => acc + g.outcomes.length, 0);
	const answeredOutcomes = outcomes.reduce(
		(acc, g) => acc + g.outcomes.filter((o) => o.desempeno !== null).length,
		0,
	);
	const progress = totalOutcomes > 0 ? Math.round((answeredOutcomes / totalOutcomes) * 100) : 0;

	return (
		<div className="min-h-screen bg-zinc-50">
			{/* Header */}
			<div className="bg-red-600 text-white py-8 px-6">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center gap-3 mb-4">
						<img src="/assets/ABETLogo.png" alt="ABET" className="h-10 w-auto" />
						<div>
							<h1 className="text-xl font-bold">Sistema ABET — Encuesta LCFC</h1>
							<p className="text-red-200 text-sm">Logro de Fin de Ciclo</p>
						</div>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
						<div>
							<span className="text-red-300 text-xs block">Carrera</span>
							<span className="font-medium">{verification.nombreCarrera}</span>
						</div>
						<div>
							<span className="text-red-300 text-xs block">Ciclo</span>
							<span className="font-medium">{verification.ciclo}</span>
						</div>
						{verification.nombreCurso && (
							<div>
								<span className="text-red-300 text-xs block">Curso</span>
								<span className="font-medium">{verification.nombreCurso}</span>
							</div>
						)}
						{(verification.codigoEstudiante ?? verification.codigo) && (
							<div>
								<span className="text-red-300 text-xs block">Estudiante</span>
								<span className="font-medium">
									{verification.codigoEstudiante ?? verification.codigo}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Progress bar */}
			<div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
				<div className="max-w-3xl mx-auto px-6 py-3">
					<div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
						<span>Progreso</span>
						<span>
							{answeredOutcomes} de {totalOutcomes} respondidos ({progress}%)
						</span>
					</div>
					<div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
						<div
							className="h-2 bg-red-600 rounded-full transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
				<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
					<ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
					<div className="text-sm text-amber-800">
						<strong>Instrucciones:</strong> Evalúa cada competencia seleccionando un puntaje del 1
						al 5. Todos los campos son obligatorios. Una vez enviada, la encuesta no podrá
						modificarse.
					</div>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
						{error}
					</div>
				)}

				{/* Outcomes by commission */}
				{outcomes.map((group) => (
					<div
						key={group.comisionId}
						className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
						<div className="bg-red-600 px-6 py-3">
							<h2 className="text-white font-bold text-sm">{group.comisionNombre}</h2>
						</div>

						<div className="divide-y divide-zinc-100">
							{group.outcomes.map((outcome) => (
								<div key={outcome.outcomeId} className="px-6 py-5">
									<div className="mb-3">
										<p className="text-sm font-bold text-zinc-800">
											{outcome.competenciaEspecifica}
										</p>
										{outcome.competenciaGeneral && (
											<p className="text-xs text-zinc-500 mt-0.5">
												General: {outcome.competenciaGeneral}
											</p>
										)}
										{outcome.descripcion && (
											<p className="text-xs text-zinc-500 mt-1 leading-relaxed">
												{outcome.descripcion}
											</p>
										)}
									</div>

									{/* Score selector */}
									<div className="flex flex-wrap gap-2">
										{SCORE_OPTIONS.map((score) => {
											const selected = outcome.desempeno === score;
											return (
												<button
													key={score}
													onClick={() => onScoreChange(group.comisionId, outcome.outcomeId, score)}
													className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all
                            ${
															selected
																? 'border-red-600 bg-red-600 text-white'
																: 'border-zinc-200 bg-white text-zinc-600 hover:border-red-400 hover:text-red-600'
														}`}>
													<span className="text-base font-bold leading-none">{score}</span>
													<span className="text-[10px] leading-none">{SCORE_LABELS[score]}</span>
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>
				))}

				{/* Comment */}
				<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 px-6 py-5">
					<TextArea
						label="Comentarios adicionales (obligatorio)"
						value={comentario}
						onChange={(e) => setComentario(e.target.value)}
						placeholder="Escribe aquí tus comentarios sobre el curso, los contenidos, o cualquier observación relevante..."
						rows={5}
					/>
				</div>

				{/* Submit */}
				<div className="flex justify-end pb-8">
					<Button
						onClick={handleSubmit}
						disabled={submitting || progress < 100 || !comentario.trim()}
						size="lg">
						{submitting ? 'Enviando...' : 'Enviar Encuesta'}
					</Button>
				</div>
			</div>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}

// ─── Already answered screen ────────────────────────────────────────────────
export function SurveyAlreadyAnswered() {
	return (
		<div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-md w-full text-center space-y-4">
				<CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto" />
				<h2 className="text-xl font-bold text-zinc-900">Encuesta ya respondida</h2>
				<p className="text-sm text-zinc-500">
					Ya has completado esta encuesta anteriormente. No es posible modificar tus respuestas una
					vez enviadas.
				</p>
				<p className="text-xs text-zinc-400">Gracias por tu participación.</p>
			</div>
		</div>
	);
}

// ─── Success screen ─────────────────────────────────────────────────────────
export function SurveySuccess() {
	return (
		<div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-md w-full text-center space-y-4">
				<CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto" />
				<h2 className="text-xl font-bold text-zinc-900">¡Encuesta enviada exitosamente!</h2>
				<p className="text-sm text-zinc-500">
					Tus respuestas han sido registradas correctamente. Gracias por completar la encuesta de
					Logro de Fin de Ciclo.
				</p>
				<p className="text-xs text-zinc-400 mt-2">Puedes cerrar esta ventana.</p>
			</div>
		</div>
	);
}
