'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export type IamViewMode = 'list' | 'new' | 'edit';

export function useIamView(tab: string) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const isNew = searchParams.get('new') === '1';
	const editParam = searchParams.get('edit');
	const parsedEditId = editParam ? Number(editParam) : null;
	const editId = parsedEditId != null && !Number.isNaN(parsedEditId) ? parsedEditId : null;
	const mode: IamViewMode = isNew ? 'new' : editId != null ? 'edit' : 'list';

	const navigate = (mutate: (params: URLSearchParams) => void) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set('tab', tab);
		mutate(next);
		router.replace(`/admin/iam?${next.toString()}`);
	};

	const openCreate = () =>
		navigate((params) => {
			params.set('new', '1');
			params.delete('edit');
		});

	const openEdit = (id: number) =>
		navigate((params) => {
			params.set('edit', String(id));
			params.delete('new');
		});

	const backToList = () =>
		navigate((params) => {
			params.delete('new');
			params.delete('edit');
		});

	return { mode, editId, openCreate, openEdit, backToList };
}
