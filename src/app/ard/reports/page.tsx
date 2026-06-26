import dynamic from 'next/dynamic';

const ArdReportsPage = dynamic(() =>
	import('@/modules/ard').then((m) => m.ArdReportsPage),
);

export default function Page() {
	return <ArdReportsPage />;
}
