import { z } from 'zod';

const id = z.coerce.number();
const nullableId = z.coerce.number().nullable();

const previousActionSchema = z
	.object({
		id,
		findingActionId: id,
		finding: z.object({ id, code: z.string() }),
	})
	.passthrough();

const findingActionSchema = z.object({ id }).passthrough();

const findingSchema = z
	.object({
		id,
		actions: z.array(findingActionSchema),
	})
	.passthrough();

const ifcHeaderSchema = z
	.object({
		id,
		coordinator: z.object({ userId: nullableId }).passthrough(),
	})
	.passthrough();

export const ifcViewPayloadSchema = z
	.object({
		ifc: ifcHeaderSchema,
		findings: z.array(findingSchema),
		previousActions: z.array(previousActionSchema).default([]),
	})
	.passthrough();

export const previousActionsSchema = z.array(previousActionSchema).default([]);

const notifyResultSchema = z.object({
	sent: z.coerce.boolean(),
	recipientsCount: z.coerce.number().default(0),
	ccCount: z.coerce.number().default(0),
	reason: z.union([z.string(), z.null()]).default(null),
});

export const submitResultSchema = z.object({
	id,
	notification: notifyResultSchema.optional().default({
		sent: false,
		recipientsCount: 0,
		ccCount: 0,
		reason: null,
	}),
});
