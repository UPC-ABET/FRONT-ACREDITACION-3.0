'use client';

import { useMemo } from 'react';
import { useI18n } from '@/providers';
import type { IamType, MatrixCell } from '../../types';
import { localizedText } from '../localizedText';

type Props = {
	modules: IamType[];
	permissions: IamType[];
	value: MatrixCell[];
	onChange: (next: MatrixCell[]) => void;
	disabled?: boolean;
};

function cellKey(moduleTypeId: number, permissionTypeId: number): string {
	return `${moduleTypeId}:${permissionTypeId}`;
}

export function RolePermissionMatrix({ modules, permissions, value, onChange, disabled }: Props) {
	const { t, locale } = useI18n();

	const selectedKeys = useMemo(
		() => new Set(value.map((cell) => cellKey(cell.moduleTypeId, cell.permissionTypeId))),
		[value],
	);

	if (modules.length === 0) {
		return <p className="text-sm italic text-zinc-500">{t('admin.iam.roles.matrix.noModules')}</p>;
	}

	if (permissions.length === 0) {
		return (
			<p className="text-sm italic text-zinc-500">{t('admin.iam.roles.matrix.noPermissions')}</p>
		);
	}

	const toggleCell = (moduleTypeId: number, permissionTypeId: number) => {
		if (disabled) return;
		const key = cellKey(moduleTypeId, permissionTypeId);
		if (selectedKeys.has(key)) {
			onChange(value.filter((cell) => cellKey(cell.moduleTypeId, cell.permissionTypeId) !== key));
		} else {
			onChange([...value, { moduleTypeId, permissionTypeId }]);
		}
	};

	return (
		<div className="overflow-x-auto rounded-lg border border-zinc-200">
			<table className="w-full border-collapse text-[13px]">
				<thead>
					<tr className="border-b border-zinc-200 bg-zinc-50">
						<th
							scope="col"
							className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 text-left text-[13px] font-bold uppercase tracking-wider text-zinc-600">
							{t('admin.iam.roles.matrix.corner')}
						</th>
						{permissions.map((permission) => (
							<th
								key={permission.id}
								scope="col"
								className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-zinc-600 whitespace-nowrap">
								{localizedText(permission.name, locale, permission.code)}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{modules.map((module) => (
						<tr
							key={module.id}
							className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
							<th
								scope="row"
								className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-[13px] font-semibold text-zinc-800 whitespace-nowrap">
								{localizedText(module.name, locale, module.code)}
							</th>
							{permissions.map((permission) => {
								const checked = selectedKeys.has(cellKey(module.id, permission.id));
								const label = `${localizedText(module.name, locale, module.code)} — ${localizedText(
									permission.name,
									locale,
									permission.code,
								)}`;
								return (
									<td key={permission.id} className="px-3 py-3 text-center">
										<input
											type="checkbox"
											className="h-5 w-5 cursor-pointer rounded border-zinc-300 accent-red-600 focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
											checked={checked}
											disabled={disabled}
											aria-label={label}
											onChange={() => toggleCell(module.id, permission.id)}
										/>
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
