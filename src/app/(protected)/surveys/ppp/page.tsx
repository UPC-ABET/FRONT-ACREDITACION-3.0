import dynamic from 'next/dynamic';

const PPPManagementView = dynamic(() =>
	import('@/modules/surveys').then((m) => m.PPPManagementView),
);

export default function PPPPage() {
  return <PPPManagementView />
}

export const metadata = {
  title: 'PPP — Prácticas Pre-Profesionales | ABET',
}
