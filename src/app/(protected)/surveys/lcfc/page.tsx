import dynamic from 'next/dynamic';

const LCFCManagementView = dynamic(() =>
	import('@/modules/surveys').then((m) => m.LCFCManagementView),
);

export default function LCFCPage() {
	return <LCFCManagementView />;
}

export const metadata = {
	title: 'LCFC — Logro de Fin de Ciclo | ABET',
};
