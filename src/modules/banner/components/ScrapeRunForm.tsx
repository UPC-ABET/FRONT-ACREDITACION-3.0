'use client';

import { useState } from 'react';
import { Button, Card, Input, Select } from '@/shared/components';
import type { SelectProps } from '@/shared/components';
import { useI18n } from '@/providers';
import { useStartBannerScrape } from '../hooks';
import { BANNER_DEPARTMENTS, DEFAULT_SCRAPE_NIVEL } from '../constants';

interface DepartmentOption {
	label: string;
	value: string;
}

interface ScrapeRunFormProps {
	onStarted: (runId: string) => void;
	onError: (error: unknown, fallbackKey?: string) => void;
}

const DEPARTMENT_OPTIONS: DepartmentOption[] = BANNER_DEPARTMENTS.map((department) => ({
	value: department.codigo,
	label: `${department.codigo} - ${department.nombre}`,
}));

export function ScrapeRunForm({ onStarted, onError }: ScrapeRunFormProps) {
	const { t } = useI18n();
	const startScrape = useStartBannerScrape();

	const [periodo, setPeriodo] = useState('');
	const [nivel, setNivel] = useState(DEFAULT_SCRAPE_NIVEL);
	const [selectedDepartments, setSelectedDepartments] = useState<DepartmentOption[]>([]);
	const [periodoError, setPeriodoError] = useState('');

	const handleDepartmentsChange: SelectProps['onChange'] = (_name, value) => {
		const list = Array.isArray(value) ? value : [];
		setSelectedDepartments(list.map((item) => ({ label: item.label, value: String(item.value) })));
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		const trimmedPeriodo = periodo.trim();
		if (!trimmedPeriodo) {
			setPeriodoError(t('banner.scrape.periodoRequired'));
			return;
		}
		setPeriodoError('');

		startScrape.mutate(
			{
				periodo: trimmedPeriodo,
				nivel: nivel.trim() || undefined,
				departamentos: selectedDepartments.map((department) => department.value),
			},
			{
				onSuccess: (response) => onStarted(response.runId),
				onError: (error) => onError(error, 'banner.scrape.startFailed'),
			},
		);
	};

	return (
		<Card
			title={t('banner.scrape.title')}
			description={t('banner.scrape.subtitle')}
			className="overflow-visible">
			<form className="space-y-5" onSubmit={handleSubmit}>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Input
						label={t('banner.scrape.periodo')}
						placeholder="202610"
						value={periodo}
						required
						error={periodoError}
						onChange={(event) => setPeriodo(event.target.value)}
					/>
					<Input
						label={t('banner.scrape.nivel')}
						placeholder={DEFAULT_SCRAPE_NIVEL}
						value={nivel}
						helperText={t('banner.scrape.nivelHelper')}
						onChange={(event) => setNivel(event.target.value)}
					/>
				</div>

				<Select
					label={t('banner.scrape.departamentos')}
					placeholder={t('banner.scrape.departamentosPlaceholder')}
					options={DEPARTMENT_OPTIONS}
					value={selectedDepartments}
					isMulti
					isSearchable
					isClearable
					isCreatable
					onChange={handleDepartmentsChange}
				/>
				<p className="-mt-2 text-xs text-zinc-500">{t('banner.scrape.departamentosHelper')}</p>

				<div className="flex justify-end">
					<Button type="submit" loading={startScrape.isPending}>
						{t('banner.scrape.submit')}
					</Button>
				</div>
			</form>
		</Card>
	);
}
