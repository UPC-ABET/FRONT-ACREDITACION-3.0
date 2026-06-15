'use client';

import { useEffect, useRef, useState } from 'react';
import RFB from '@novnc/novnc';
import { Spinner } from '@/shared/components';
import { useI18n } from '@/providers';

interface NoVncViewerProps {
	url: string;
	onDisconnected?: (clean: boolean) => void;
}

export function NoVncViewer({ url, onDisconnected }: NoVncViewerProps) {
	const { t } = useI18n();
	const containerRef = useRef<HTMLDivElement>(null);
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const rfb = new RFB(container, url, {});
		rfb.scaleViewport = true;
		rfb.background = '#18181b';

		const handleConnect = () => setConnected(true);
		const handleDisconnect = (event: CustomEvent<{ clean: boolean }>) => {
			setConnected(false);
			onDisconnected?.(event.detail.clean);
		};

		rfb.addEventListener('connect', handleConnect);
		rfb.addEventListener('disconnect', handleDisconnect);

		return () => {
			rfb.removeEventListener('connect', handleConnect);
			rfb.removeEventListener('disconnect', handleDisconnect);
			rfb.disconnect();
		};
	}, [url, onDisconnected]);

	return (
		<div className="relative w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
			<div ref={containerRef} className="h-[60vh] w-full" />
			{!connected && (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/80 text-zinc-300">
					<Spinner size="lg" />
					<span className="text-sm">{t('banner.login.connecting')}</span>
				</div>
			)}
		</div>
	);
}
