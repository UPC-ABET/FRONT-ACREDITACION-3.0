import { Metadata } from 'next';
import ChartsPageClient from './ChartsPageClient';

export const metadata: Metadata = {
	title: 'Graficos',
};

export default function Page() {
	return <ChartsPageClient />;
}
