import { Suspense } from 'react';
import { GRARespondPage } from '@/modules/surveys/pages';

export default function Page() {
	return (
		<Suspense>
			<GRARespondPage />
		</Suspense>
	);
}
