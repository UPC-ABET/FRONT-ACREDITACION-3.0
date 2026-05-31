'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, ErrorDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import {
	useAssociateProgramCommission,
	useProgramCommissions,
	useUnassociateProgramCommission,
} from '../hooks';

interface ProgramOption {
	id: number;
	code: string;
	label: string;
}

interface CommissionOption {
	id: number;
	code: string;
	label: string;
}

interface ProgramCommissionPanelProps {
	periodId: number | null;
	programs: ProgramOption[];
	commissions: CommissionOption[];
	debounceMs?: number;
}

export default function ProgramCommissionPanel({
	periodId,
	programs,
	commissions,
	debounceMs = 500,
}: ProgramCommissionPanelProps) {
	const { t } = useI18n();
	const { data: existing } = useProgramCommissions(periodId);
	const associate = useAssociateProgramCommission(periodId);
	const unassociate = useUnassociateProgramCommission(periodId);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	// programId -> Map(commissionId -> program_commission_id).
	const serverState = useMemo(() => {
		const map = new Map<number, Map<number, number>>();
		for (const pc of existing ?? []) {
			if (!map.has(pc.program_id)) map.set(pc.program_id, new Map());
			map.get(pc.program_id)!.set(pc.commission_id, pc.id);
		}
		return map;
	}, [existing]);

	// Optimistic chip selection; gets re-seeded from server snapshots and edited locally on toggle.
	const [pending, setPending] = useState<Map<number, Set<number>>>(new Map());

	useEffect(() => {
		const seed = new Map<number, Set<number>>();
		for (const [programId, m] of serverState) seed.set(programId, new Set(m.keys()));
		setPending(seed);
	}, [serverState]);

	useEffect(() => {
		const timers = timersRef.current;
		return () => timers.forEach((timer) => clearTimeout(timer));
	}, []);

	const isChecked = (programId: number, commissionId: number) =>
		pending.get(programId)?.has(commissionId) ?? false;

	const toggle = (programId: number, commissionId: number) => {
		if (!periodId) return;
		const next = new Map(pending);
		const set = new Set(next.get(programId) ?? []);
		const willAdd = !set.has(commissionId);
		if (willAdd) set.add(commissionId);
		else set.delete(commissionId);
		next.set(programId, set);
		setPending(next);

		const key = `${programId}|${commissionId}`;
		const existingTimer = timersRef.current.get(key);
		if (existingTimer) clearTimeout(existingTimer);

		const timer = setTimeout(() => {
			timersRef.current.delete(key);
			if (willAdd) {
				associate.mutate(
					{ periodId, programId, commissionId },
					{
						onError: (err) =>
							setErrorMessage(err.message || t('loadsSetup.programCommission.error.associate')),
					},
				);
			} else {
				const id = serverState.get(programId)?.get(commissionId);
				if (id === undefined) return;
				unassociate.mutate(
					{ periodId, id },
					{
						onError: (err) =>
							setErrorMessage(err.message || t('loadsSetup.programCommission.error.unassociate')),
					},
				);
			}
		}, debounceMs);
		timersRef.current.set(key, timer);
	};

	if (!periodId) {
		return (
			<Card
				title={t('loadsSetup.programCommission.title')}
				description={t('loadsSetup.programCommission.description')}>
				<p className="py-4 text-center text-sm text-gray-500">
					{t('loadsSetup.programCommission.pickPeriodFirst')}
				</p>
			</Card>
		);
	}

	return (
		<Card
			title={t('loadsSetup.programCommission.title')}
			description={t('loadsSetup.programCommission.description')}>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{programs.map((p) => (
					<div key={p.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
						<div className="mb-2">
							<p className="text-sm font-semibold text-gray-800">{p.code}</p>
							<p className="text-xs text-gray-500">{p.label}</p>
						</div>
						<div className="flex flex-wrap gap-1">
							{commissions.map((c) => {
								const active = isChecked(p.id, c.id);
								return (
									<button
										key={c.id}
										type="button"
										onClick={() => toggle(p.id, c.id)}
										className={`rounded-full px-3 py-1 text-xs transition-colors ${
											active
												? 'border border-red-400 bg-red-50 text-red-700'
												: 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-red-300'
										}`}>
										{active ? '✓ ' : ''}
										{c.code}
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			<ErrorDialog
				isOpen={errorMessage !== null}
				onClose={() => setErrorMessage(null)}
				title={t('loadsSetup.programCommission.errorTitle')}
				message={errorMessage ?? ''}
			/>
		</Card>
	);
}
