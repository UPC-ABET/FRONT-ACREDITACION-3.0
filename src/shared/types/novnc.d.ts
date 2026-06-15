declare module '@novnc/novnc' {
	export interface RFBDisconnectDetail {
		clean: boolean;
	}

	export interface RFBCredentials {
		username?: string;
		password?: string;
		target?: string;
	}

	export interface RFBOptions {
		shared?: boolean;
		credentials?: RFBCredentials;
		repeaterID?: string;
		wsProtocols?: string[];
	}

	export default class RFB {
		constructor(target: Element, url: string, options?: RFBOptions);
		scaleViewport: boolean;
		clipViewport: boolean;
		background: string;
		viewOnly: boolean;
		focusOnClick: boolean;
		disconnect(): void;
		addEventListener(type: 'connect', listener: () => void): void;
		addEventListener(
			type: 'disconnect',
			listener: (event: CustomEvent<RFBDisconnectDetail>) => void,
		): void;
		addEventListener(type: string, listener: (event: Event) => void): void;
		removeEventListener(type: 'connect', listener: () => void): void;
		removeEventListener(
			type: 'disconnect',
			listener: (event: CustomEvent<RFBDisconnectDetail>) => void,
		): void;
		removeEventListener(type: string, listener: (event: Event) => void): void;
	}
}
