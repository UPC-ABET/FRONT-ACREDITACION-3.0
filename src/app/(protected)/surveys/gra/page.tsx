import dynamic from 'next/dynamic';

const GRAManagementView = dynamic(() =>
	import('@/modules/surveys').then((m) => m.GRAManagementView),
);

export default function GRAPage() {
  return <GRAManagementView />
}

export const metadata = {
  title: 'GRA — Encuestas de Graduandos | ABET',
}
