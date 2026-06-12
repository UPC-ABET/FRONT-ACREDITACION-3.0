'use client';

import { useMemo, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Select,
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { TypeOption } from '@/modules/core';
import type {
	CampusResponse,
	EnrolledStudentMaintenanceItem,
	EnrolledStudentMaintenanceUpdate,
	ProgramResponse,
} from '../types';

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

type Props = {
	item: EnrolledStudentMaintenanceItem;
	programs: ProgramResponse[];
	campuses: CampusResponse[];
	modalityTypes: TypeOption[];
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSave: (body: EnrolledStudentMaintenanceUpdate) => void;
};

function CurrentValue({ label, value }: { label: string; value: string }) {
	return (
		<p className="mt-1 text-xs text-zinc-500">
			{label}: <span className="font-medium text-zinc-700">{value || '—'}</span>
		</p>
	);
}

export function EnrolledStudentMaintenanceEditDialog({
	item,
	programs,
	campuses,
	modalityTypes,
	saving,
	errorMessage,
	onClose,
	onSave,
}: Props) {
	const { t, locale } = useI18n();

	const [studentCode, setStudentCode] = useState(item.studentCode);
	const [firstName, setFirstName] = useState(item.firstName);
	const [lastName, setLastName] = useState(item.lastName);
	const [programId, setProgramId] = useState<number | null>(null);
	const [campusId, setCampusId] = useState<number | null>(null);
	const [modalityTypeId, setModalityTypeId] = useState<number | null>(null);

	const programOptions = useMemo(
		() =>
			programs.map((program) => ({
				value: program.id,
				label: localized(program.name, locale) || program.code,
			})),
		[programs, locale],
	);
	const campusOptions = useMemo(
		() =>
			campuses.map((campus) => ({
				value: campus.id,
				label: localized(campus.name, locale) || campus.code,
			})),
		[campuses, locale],
	);
	const modalityOptions = useMemo(
		() =>
			modalityTypes.map((type) => ({
				value: type.id,
				label: localized(type.name, locale) || type.code,
			})),
		[modalityTypes, locale],
	);

	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;
	const selectedCampus = campusOptions.find((option) => option.value === campusId) ?? null;
	const selectedModality =
		modalityOptions.find((option) => option.value === modalityTypeId) ?? null;

	const canSave =
		studentCode.trim() !== '' && firstName.trim() !== '' && lastName.trim() !== '' && !saving;

	const handleSubmit = () => {
		const body: EnrolledStudentMaintenanceUpdate = {};
		const trimmedCode = studentCode.trim();
		const trimmedFirstName = firstName.trim();
		const trimmedLastName = lastName.trim();
		if (trimmedCode && trimmedCode !== item.studentCode) body.studentCode = trimmedCode;
		if (trimmedFirstName && trimmedFirstName !== item.firstName) body.firstName = trimmedFirstName;
		if (trimmedLastName && trimmedLastName !== item.lastName) body.lastName = trimmedLastName;
		if (programId != null) body.programId = programId;
		if (campusId != null) body.campusId = campusId;
		if (modalityTypeId != null) body.enrollementModalityTypeId = modalityTypeId;
		onSave(body);
	};

	const currentLabel = t('loads.enrolledStudentsMaintenance.edit.current');

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t('loads.enrolledStudentsMaintenance.edit.title')}</DialogTitle>
					<DialogDescription>
						{t('loads.enrolledStudentsMaintenance.edit.subtitle')}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						label={t('loads.enrolledStudentsMaintenance.col.studentCode')}
						value={studentCode}
						onChange={(event) => setStudentCode(event.target.value)}
						required
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							label={t('loads.enrolledStudentsMaintenance.col.firstName')}
							value={firstName}
							onChange={(event) => setFirstName(event.target.value)}
							required
						/>
						<Input
							label={t('loads.enrolledStudentsMaintenance.col.lastName')}
							value={lastName}
							onChange={(event) => setLastName(event.target.value)}
							required
						/>
					</div>

					<div>
						<Select
							name="program"
							label={t('loads.enrolledStudentsMaintenance.col.program')}
							placeholder={t('loads.enrolledStudentsMaintenance.edit.programPlaceholder')}
							isSearchable
							isClearable
							options={programOptions}
							value={selectedProgram}
							onChange={(_name, value) =>
								setProgramId(value && !Array.isArray(value) ? Number(value.value) : null)
							}
						/>
						<CurrentValue label={currentLabel} value={localized(item.programName, locale)} />
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Select
								name="campus"
								label={t('loads.enrolledStudentsMaintenance.col.campus')}
								placeholder={t('loads.enrolledStudentsMaintenance.edit.campusPlaceholder')}
								isSearchable
								isClearable
								options={campusOptions}
								value={selectedCampus}
								onChange={(_name, value) =>
									setCampusId(value && !Array.isArray(value) ? Number(value.value) : null)
								}
							/>
							<CurrentValue label={currentLabel} value={localized(item.campusName, locale)} />
						</div>
						<div>
							<Select
								name="modality"
								label={t('loads.enrolledStudentsMaintenance.col.modality')}
								placeholder={t('loads.enrolledStudentsMaintenance.edit.modalityPlaceholder')}
								isSearchable
								isClearable
								options={modalityOptions}
								value={selectedModality}
								onChange={(_name, value) =>
									setModalityTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
								}
							/>
							<CurrentValue label={currentLabel} value={localized(item.modalityTypeName, locale)} />
						</div>
					</div>

					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={!canSave}>
						{saving ? t('loading.default') : t('loads.enrolledStudentsMaintenance.edit.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
