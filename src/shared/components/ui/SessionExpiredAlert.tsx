'use client';

import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { useI18n } from '@/providers';

type SessionExpiredAlertProps = {
	isOpen: boolean;
	onLogout: () => void;
};

export function SessionExpiredAlert({ isOpen, onLogout }: SessionExpiredAlertProps) {
	const { t } = useI18n();

	return (
		<Dialog open={isOpen}>
			<DialogContent showCloseButton={false} className="max-w-sm">
				<div>
					<div className="flex items-center justify-center space-x-5">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
							<InformationCircleIcon className="h-6 w-6 text-amber-500" aria-hidden="true" />
						</div>
						<DialogHeader className="gap-0">
							<DialogTitle className="text-base font-semibold text-zinc-900">
								{t('sessionExpired.title')}
							</DialogTitle>
						</DialogHeader>
					</div>
					<div className="mt-3 text-center sm:mt-5">
						<p className="text-sm text-zinc-500">{t('sessionExpired.message')}</p>
					</div>
				</div>
				<div className="mt-5 sm:mt-6">
					<Button type="button" variant="secondary" className="w-full" onClick={onLogout}>
						{t('sessionExpired.action')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
