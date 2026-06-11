'use client';

import { BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import type { HeadFormErrors, HeadFormValue, UserOption } from '../types';
import { HeadFields } from './HeadFields';

interface Props {
	value: HeadFormValue;
	onChange: (next: HeadFormValue) => void;
	errors?: HeadFormErrors;
	userOptions: UserOption[];
	usersLoading: boolean;
	disabled?: boolean;
}

export function DeanSection({
	value,
	onChange,
	errors,
	userOptions,
	usersLoading,
	disabled,
}: Props) {
	const { t } = useI18n();

	return (
		<section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
			<header className="flex items-center gap-2">
				<BuildingLibraryIcon className="h-5 w-5 text-red-700" />
				<h3 className="text-lg font-bold uppercase tracking-wider text-zinc-900">
					{t('admin.chartHeads.dean.title')}
				</h3>
			</header>
			<HeadFields
				value={value}
				onChange={onChange}
				errors={errors}
				userOptions={userOptions}
				usersLoading={usersLoading}
				disabled={disabled}
			/>
		</section>
	);
}
