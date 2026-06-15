'use client';

import { BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { Title } from '@/shared/components';
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
				<Title
					title={t('admin.chartHeads.dean.title')}
					className="[&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-zinc-900"
				/>
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
