export const OUTCOME_CONVERSION_ERROR_KEYS = {
	INVALID_FORMULA: 'error.outcomeConversion.invalidFormula',
	UNKNOWN_OUTCOME_REFERENCE: 'error.outcomeConversion.unknownOutcomeReference',
} as const;

export type OutcomeConversionFormulaValidation = {
	references: string[];
	unknownCodes: string[];
	errorKey: string | null;
};

type Token =
	| { kind: 'number' }
	| { kind: 'reference'; code: string }
	| { kind: 'operator'; value: '+' | '-' | '*' | '/' }
	| { kind: 'openParen' }
	| { kind: 'closeParen' };

const NUMBER_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)/;
const BARE_REFERENCE_PATTERN = /^[A-Za-z][A-Za-z0-9_]*/;
const OPERATORS = new Set(['+', '-', '*', '/']);

// Bracketed references (`[6]`) are mandatory for codes starting with a digit, since a bare `6`
// is the number 6. Codes starting with a letter may appear bare (`A`), so both forms are lexed.
function tokenize(formula: string): Token[] | null {
	const tokens: Token[] = [];
	let index = 0;

	while (index < formula.length) {
		const character = formula[index];

		if (/\s/.test(character)) {
			index += 1;
			continue;
		}

		if (character === '[') {
			const closingIndex = formula.indexOf(']', index);
			if (closingIndex === -1) return null;
			const code = formula.slice(index + 1, closingIndex).trim();
			if (code === '') return null;
			tokens.push({ kind: 'reference', code });
			index = closingIndex + 1;
			continue;
		}

		if (character === '(') {
			tokens.push({ kind: 'openParen' });
			index += 1;
			continue;
		}

		if (character === ')') {
			tokens.push({ kind: 'closeParen' });
			index += 1;
			continue;
		}

		if (OPERATORS.has(character)) {
			tokens.push({ kind: 'operator', value: character as '+' | '-' | '*' | '/' });
			index += 1;
			continue;
		}

		const remainder = formula.slice(index);

		const numberMatch = NUMBER_PATTERN.exec(remainder);
		if (numberMatch) {
			tokens.push({ kind: 'number' });
			index += numberMatch[0].length;
			continue;
		}

		const referenceMatch = BARE_REFERENCE_PATTERN.exec(remainder);
		if (referenceMatch) {
			tokens.push({ kind: 'reference', code: referenceMatch[0] });
			index += referenceMatch[0].length;
			continue;
		}

		return null;
	}

	return tokens;
}

// Recursive descent over the arithmetic grammar the backend accepts:
//   expression := term (('+' | '-') term)*
//   term       := factor (('*' | '/') factor)*
//   factor     := ('+' | '-')* primary
//   primary    := number | reference | '(' expression ')'
function parse(tokens: Token[]): boolean {
	let position = 0;

	const peek = (): Token | undefined => tokens[position];

	function parseExpression(): boolean {
		if (!parseTerm()) return false;
		let token = peek();
		while (token?.kind === 'operator' && (token.value === '+' || token.value === '-')) {
			position += 1;
			if (!parseTerm()) return false;
			token = peek();
		}
		return true;
	}

	function parseTerm(): boolean {
		if (!parseFactor()) return false;
		let token = peek();
		while (token?.kind === 'operator' && (token.value === '*' || token.value === '/')) {
			position += 1;
			if (!parseFactor()) return false;
			token = peek();
		}
		return true;
	}

	function parseFactor(): boolean {
		let token = peek();
		while (token?.kind === 'operator' && (token.value === '+' || token.value === '-')) {
			position += 1;
			token = peek();
		}
		return parsePrimary();
	}

	function parsePrimary(): boolean {
		const token = peek();
		if (!token) return false;

		if (token.kind === 'number' || token.kind === 'reference') {
			position += 1;
			return true;
		}

		if (token.kind === 'openParen') {
			position += 1;
			if (!parseExpression()) return false;
			if (peek()?.kind !== 'closeParen') return false;
			position += 1;
			return true;
		}

		return false;
	}

	if (tokens.length === 0) return false;
	if (!parseExpression()) return false;
	return position === tokens.length;
}

export function validateOutcomeConversionFormula(
	formula: string,
	availableOutcomeCodes: string[],
): OutcomeConversionFormulaValidation {
	const tokens = tokenize(formula);

	if (tokens === null || !parse(tokens)) {
		return {
			references: [],
			unknownCodes: [],
			errorKey: OUTCOME_CONVERSION_ERROR_KEYS.INVALID_FORMULA,
		};
	}

	const references: string[] = [];
	for (const token of tokens) {
		if (token.kind === 'reference' && !references.includes(token.code)) {
			references.push(token.code);
		}
	}

	// The backend owns code matching; compare case-insensitively so a lowercase code is left for
	// it to accept or reject instead of being blocked here.
	const knownCodes = new Set(availableOutcomeCodes.map((code) => code.toLowerCase()));
	const unknownCodes = references.filter((code) => !knownCodes.has(code.toLowerCase()));

	return {
		references,
		unknownCodes,
		errorKey:
			unknownCodes.length > 0 ? OUTCOME_CONVERSION_ERROR_KEYS.UNKNOWN_OUTCOME_REFERENCE : null,
	};
}
