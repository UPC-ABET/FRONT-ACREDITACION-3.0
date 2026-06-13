'use client';

import { useI18n } from '@/providers';
import type { AdminRole } from '../../types';
import { localizedText } from '../localizedText';

type Props = {
	roles: AdminRole[];
	selectedRoleIds: number[];
	onChange: (next: number[]) => void;
	disabled?: boolean;
};

export function UserRolesField({ roles, selectedRoleIds, onChange, disabled }: Props) {
	const { t, locale } = useI18n();

	if (roles.length === 0) {
		return <p className="text-sm italic text-zinc-500">{t('admin.iam.users.form.rolesEmpty')}</p>;
	}

	const toggleRole = (roleId: number) => {
		if (disabled) return;
		onChange(
			selectedRoleIds.includes(roleId)
				? selectedRoleIds.filter((id) => id !== roleId)
				: [...selectedRoleIds, roleId],
		);
	};

	return (
		<div className="grid gap-1 rounded-lg border border-zinc-200 p-2 sm:grid-cols-2">
			{roles.map((role) => {
				const checked = selectedRoleIds.includes(role.id);
				return (
					<label
						key={role.id}
						className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
							checked ? 'bg-red-50 text-red-900' : 'hover:bg-zinc-50'
						}`}>
						<input
							type="checkbox"
							className="h-5 w-5 cursor-pointer rounded border-zinc-300 accent-red-600 focus:ring-2 focus:ring-red-500"
							checked={checked}
							disabled={disabled}
							onChange={() => toggleRole(role.id)}
						/>
						<span className="flex flex-col">
							<span className="font-medium">{localizedText(role.name, locale, role.code)}</span>
							<span className="font-mono text-xs text-zinc-400">{role.code}</span>
						</span>
					</label>
				);
			})}
		</div>
	);
}
