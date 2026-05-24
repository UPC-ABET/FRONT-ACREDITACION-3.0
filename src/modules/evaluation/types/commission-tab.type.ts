import { OutcomeWithCriteria } from './outcome-with-criteria.type';

export type CommissionTab = {
	id: string;
	code: string;
	name: { en: string; es: string };
	accreditorCode: string;
	isComplete: boolean;
	outcomes: OutcomeWithCriteria[];
};
