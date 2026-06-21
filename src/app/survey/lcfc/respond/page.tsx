import { Suspense } from 'react';
import { LCFCRespondPage } from '@/modules/surveys/pages';

export default function Page() {
	return (
		<Suspense>
			<LCFCRespondPage />
		</Suspense>
	);
}
