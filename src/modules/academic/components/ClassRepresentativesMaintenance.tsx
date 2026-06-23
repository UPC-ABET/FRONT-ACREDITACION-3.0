'use client';

import { useState } from 'react';
import { useClassRepresentativesMaintenance } from '../hooks/useClassRepresentativesMaintenance';
import { ClassRepresentativeCreateDialog } from './ClassRepresentativeCreateDialog';
import { useI18n } from '@/providers';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared';

export function ClassRepresentativesMaintenance() {
	const { t } = useI18n();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);

	const { representatives, isLoading, assignRepresentative, isAssigning, removeRepresentative } =
		useClassRepresentativesMaintenance();

	const handleSave = async (body: { studentCode: string; sectionCode: string }) => {
		try {
			setApiError(null);
			await assignRepresentative(body);
			setIsDialogOpen(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setApiError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.classRepresentativesMaintenance.create.error'),
				),
			);
		}
	};

	const handleRemove = async (studentCode: string, sectionCode: string) => {
		const confirmRemove = window.confirm(t('¿Está seguro de que desea remover a este delegado?'));
		if (!confirmRemove) return;

		try {
			await removeRepresentative({ studentCode, sectionCode });
		} catch (error) {
			console.error(error);
			alert(t('error.internalServer'));
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-medium text-gray-900">{t('Listado de Delegados')}</h3>
				<button
					onClick={() => {
						setApiError(null);
						setIsDialogOpen(true);
					}}
					className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
					<span className="mr-1.5 font-bold">+</span>
					{t('Nuevo')}
				</button>
			</div>

			<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
				<table className="min-w-full divide-y divide-gray-300">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
								{t('Nombre Curso')}
							</th>
							<th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
								{t('Código Curso')}
							</th>
							<th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
								{t('Código Sección')}
							</th>
							<th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
								{t('Código Alumno')}
							</th>
							<th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
								{t('Nombre Alumno')}
							</th>
							<th className="relative px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
								{t('Acciones')}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white">
						{isLoading ? (
							<tr>
								<td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
									{t('Cargando delegados...')}
								</td>
							</tr>
						) : representatives.length === 0 ? (
							<tr>
								<td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
									{t('No se encontraron delegados registrados.')}
								</td>
							</tr>
						) : (
							representatives.map((row) => (
								<tr key={row.id} className="hover:bg-gray-50">
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
										{row.courseName}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{row.courseCode}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{row.sectionCode}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{row.studentCode}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
										{row.studentFullName}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium">
										<button
											onClick={() => handleRemove(row.studentCode, row.sectionCode)}
											className="inline-flex items-center justify-center rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
											title={t('Remover')}>
											{/* Representación del icono circular menos (-) de la maqueta */}
											<span className="w-5 h-5 flex items-center justify-center font-black border border-current rounded-full text-xs">
												—
											</span>
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{isDialogOpen && (
				<ClassRepresentativeCreateDialog
					saving={isAssigning}
					errorMessage={apiError}
					onClose={() => setIsDialogOpen(false)}
					onSave={handleSave}
				/>
			)}
		</div>
	);
}
