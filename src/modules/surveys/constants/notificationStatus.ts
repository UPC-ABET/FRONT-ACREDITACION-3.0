export const NOTIFICATION_STATUS = {
	SENT: 'ENVIADO',
	PENDING: 'PENDIENTE',
	RESPONDED: 'RESPONDIDO',
} as const;

export type NotificationStatusCode = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

export const NOTIFICATION_STATUS_LABEL_KEY: Record<NotificationStatusCode, string> = {
	ENVIADO: 'surveys.gra.notifications.status.sent',
	PENDIENTE: 'surveys.gra.notifications.status.pending',
	RESPONDIDO: 'surveys.gra.notifications.status.responded',
};
