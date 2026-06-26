import dynamic from 'next/dynamic';

const ArdRegistrationPage = dynamic(() =>
	import('@/modules/ard').then((m) => m.ArdRegistrationPage),
);

export default function Page() {
	return <ArdRegistrationPage />;
}
