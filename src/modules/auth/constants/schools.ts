export const SCHOOL_OPTIONS = [
	{ id: 'EISCB', labelKey: 'school.eiscb' },
	{ id: 'EISCC', labelKey: 'school.eiscc' },
	{ id: 'INGGMI', labelKey: 'school.inggmi' },
	{ id: 'INGGEM', labelKey: 'school.inggem' },
	{ id: 'ESCEL', labelKey: 'school.escel' },
	{ id: 'INGAMB', labelKey: 'school.ingamb' },
	{ id: 'INGBIO', labelKey: 'school.ingbio' },
	{ id: 'INGCIV', labelKey: 'school.ingciv' },
	{ id: 'INGIND', labelKey: 'school.ingind' },
];

export const SCHOOL_LABEL_KEYS_BY_CODE = SCHOOL_OPTIONS.reduce<Record<string, string>>(
	(acc, option) => {
		acc[option.id] = option.labelKey;
		return acc;
	},
	{},
);
