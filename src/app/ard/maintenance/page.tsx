import dynamic from 'next/dynamic';

const ArdMaintenancePage = dynamic(() =>
	import('@/modules/ard').then((m) => m.ArdMaintenancePage),
);

export default function Page() {
	return <ArdMaintenancePage />;
}
