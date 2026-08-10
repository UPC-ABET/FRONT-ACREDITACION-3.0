'use client';

import { useState, type FormEvent } from 'react';
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { resolveApiErrorContent, type ApiErrorContent } from '@/shared/utils/tryTranslate';
import { useSavePlannerCredentials } from '../hooks';

interface PlannerCredentialsDialogProps {
	initialUsername: string | null;
	onClose: () => void;
	onSaved: () => void;
}

export function PlannerCredentialsDialog({
	initialUsername,
	onClose,
	onSaved,
}: PlannerCredentialsDialogProps) {
	const { t } = useI18n();
	const saveCredentials = useSavePlannerCredentials();

	const [username, setUsername] = useState(initialUsername ?? '');
	const [password, setPassword] = useState('');
	const [formError, setFormError] = useState<ApiErrorContent | null>(null);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);

		saveCredentials.mutate(
			{ username, password },
			{
				onSuccess: () => onSaved(),
				onError: (error) => {
					const content = resolveApiErrorContent(t, error, 'planner.credentials.saveError');
					// Defensive: never let a backend validation message that happens to echo the
					// submitted password back reach the DOM as visible text.
					const reasons = content.reasons.filter(
						(reason) => !password || !reason.includes(password),
					);
					setFormError({ ...content, reasons });
				},
				onSettled: () => setPassword(''),
			},
		);
	};

	return (
		<Dialog
			open
			onOpenChange={(next) => {
				if (!next) onClose();
			}}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t('planner.credentials.dialogTitle')}</DialogTitle>
					<DialogDescription>{t('planner.credentials.dialogSubtitle')}</DialogDescription>
				</DialogHeader>

				<form id="planner-credentials-form" onSubmit={handleSubmit} className="space-y-4">
					{formError && (
						<Alert variant="destructive">
							<AlertTitle>{formError.title}</AlertTitle>
							{formError.reasons.length > 0 && (
								<AlertDescription>
									<ul className="list-disc space-y-0.5 pl-4">
										{formError.reasons.map((reason) => (
											<li key={reason}>{reason}</li>
										))}
									</ul>
								</AlertDescription>
							)}
						</Alert>
					)}

					<Input
						label={t('planner.credentials.usernameLabel')}
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						autoComplete="username"
						disabled={saveCredentials.isPending}
						required
					/>
					<Input
						type="password"
						label={t('planner.credentials.passwordLabel')}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						autoComplete="new-password"
						disabled={saveCredentials.isPending}
						required
					/>
				</form>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saveCredentials.isPending}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button type="submit" form="planner-credentials-form" loading={saveCredentials.isPending}>
						{t('planner.credentials.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
