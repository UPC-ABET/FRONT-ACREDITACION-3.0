import { z } from 'zod';

const id = z.coerce.number();
const nullableId = z.coerce.number().nullable();

const previousActionSchema = z
	.object({
		id,
		finding_action_id: id,
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
		coordinator: z.object({ user_id: nullableId }).passthrough(),
	})
	.passthrough();

export const ifcViewPayloadSchema = z
	.object({
		ifc: ifcHeaderSchema,
		findings: z.array(findingSchema),
		previous_actions: z.array(previousActionSchema).default([]),
	})
	.passthrough();

export const previousActionsSchema = z.array(previousActionSchema).default([]);

const notifyResultSchema = z.object({
	sent: z.coerce.boolean(),
	recipients_count: z.coerce.number().default(0),
	cc_count: z.coerce.number().default(0),
	reason: z.union([z.string(), z.null()]).default(null),
});

export const submitResultSchema = z.object({
	id,
	notification: notifyResultSchema.optional().default({
		sent: false,
		recipients_count: 0,
		cc_count: 0,
		reason: null,
	}),
});
