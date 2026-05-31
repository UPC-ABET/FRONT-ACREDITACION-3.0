'use client';

import { useEffect, useRef, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
} from '@/shared/components';
import { useI18n } from '@/providers';

interface BannerScrapingDialogProps {
	open: boolean;
	onClose: () => void;
	flowDisplayKey: string;
	onTrigger: (credentials: { username: string; password: string }) => Promise<void>;
}

const AUTO_CLOSE_DELAY_MS = 800;

export default function BannerScrapingDialog({
	open,
	onClose,
	flowDisplayKey,
	onTrigger,
}: BannerScrapingDialogProps) {
	const { t } = useI18n();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [running, setRunning] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		};
	}, []);

	const handleStart = async () => {
		if (!username || !password) return;
		setRunning(true);
		setLogs([t('uploads.canvas.banner.log.connecting')]);
		try {
			setLogs((prev) => [...prev, t('uploads.canvas.banner.log.authenticated')]);
			await onTrigger({ username, password });
			setLogs((prev) => [...prev, t('uploads.canvas.banner.log.done')]);
			closeTimerRef.current = setTimeout(() => {
				setRunning(false);
				onClose();
			}, AUTO_CLOSE_DELAY_MS);
		} catch (err) {
			setLogs((prev) => [
				...prev,
				`❌ ${err instanceof Error ? err.message : t('uploads.canvas.banner.log.unknownError')}`,
			]);
			setRunning(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o && !running) onClose();
			}}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('uploads.canvas.banner.title')}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<p className="text-sm text-gray-600">
						{t('uploads.canvas.banner.description')}{' '}
						<span className="font-medium">{t(flowDisplayKey)}</span>.
					</p>
					<Input
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder={t('uploads.canvas.banner.username')}
						disabled={running}
					/>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder={t('uploads.canvas.banner.password')}
						disabled={running}
					/>

					{running && (
						<div className="rounded-md border border-blue-200 bg-blue-50 p-3">
							<div className="mb-2 flex items-center gap-2">
								<span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
								<span className="text-sm font-medium text-blue-700">
									{t('uploads.canvas.banner.running')}
								</span>
							</div>
							<ul className="space-y-1 text-xs text-blue-800">
								{logs.map((log, i) => (
									<li key={i}>• {log}</li>
								))}
							</ul>
						</div>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button variant="secondary" onClick={onClose} disabled={running}>
							{t('uploads.canvas.banner.cancel')}
						</Button>
						<Button
							variant="primary"
							onClick={handleStart}
							disabled={running || !username || !password}>
							{running ? t('uploads.canvas.banner.starting') : t('uploads.canvas.banner.start')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
