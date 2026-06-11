const isDev = process.env.NODE_ENV !== 'production';

const noop = () => {};

export const logger = {
	debug: isDev ? console.debug.bind(console) : noop,
	log: isDev ? console.log.bind(console) : noop,
	info: isDev ? console.info.bind(console) : noop,
	warn: isDev ? console.warn.bind(console) : noop,
	error: console.error.bind(console),
} as const;
