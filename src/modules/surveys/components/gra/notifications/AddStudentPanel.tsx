'use client';

import React, { useState } from 'react';
import { Input, Button, Toast } from '@/shared/components';
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useGRAStudentSearch } from '../../../hooks';

interface AddStudentPanelProps {
	readonly programId: number;
	readonly academicPeriodId: number;
	readonly onStudentAdded?: () => void;
}

export function AddStudentPanel({
	programId,
	academicPeriodId,
	onStudentAdded,
}: AddStudentPanelProps) {
	const { result, loading, error, search, add, reset } = useGRAStudentSearch();
	const [codigo, setCodigo] = useState('');
	const [adding, setAdding] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	async function handleSearch() {
		if (!codigo.trim()) return;
		await search(codigo.trim(), programId);
	}

	async function handleAdd() {
		if (!result) return;
		setAdding(true);
		await add(
			{
				studentId: result.studentId,
				programId: programId,
				academicPeriodId: academicPeriodId,
			},
			() => {
				setToast({ open: true, type: 'success', msg: `${result.name} agregado exitosamente.` });
				setCodigo('');
				reset();
				onStudentAdded?.();
			},
		);
		setAdding(false);
	}

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-bold text-zinc-700">Agregar Estudiante Individual</h4>

			<div className="flex gap-2">
				<Input
					placeholder="Código del estudiante (ej: 2020001)"
					value={codigo}
					onChange={(e) => setCodigo(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
				/>
				<Button
					onClick={handleSearch}
					disabled={loading || !codigo.trim()}
					size="md"
					aria-label="Buscar estudiante">
					<MagnifyingGlassIcon className="h-4 w-4" />
				</Button>
			</div>

			{error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

			{result && (
				<div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<span className="text-xs text-zinc-500 block">Nombre</span>
							<span className="font-medium text-zinc-800">{result.name}</span>
						</div>
						<div>
							<span className="text-xs text-zinc-500 block">Código</span>
							<span className="font-medium text-zinc-800">{result.code}</span>
						</div>
						<div>
							<span className="text-xs text-zinc-500 block">Email</span>
							<span className="font-medium text-zinc-800">{result.email}</span>
						</div>
						<div>
							<span className="text-xs text-zinc-500 block">Carrera</span>
							<span className="font-medium text-zinc-800">{result.career}</span>
						</div>
					</div>

					<Button onClick={handleAdd} disabled={adding} size="sm">
						<UserPlusIcon className="h-4 w-4 mr-1" />
						{adding ? 'Agregando...' : 'Agregar a Notificación'}
					</Button>
				</div>
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
