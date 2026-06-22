import { z } from 'zod';
import type { IFCViewPayload, PreviousAction } from '../types';

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

// Partial runtime guard: coerces the ids it touches and defaults `previousActions`, then
// passes the rest of the backend-owned payload through untyped. The output is declared as
// the full domain type here — the single deliberate boundary where the partial guard meets
// the typed contract — so service call sites consume it without casts.
export const ifcViewPayloadSchema = z
	.object({
		ifc: ifcHeaderSchema,
		findings: z.array(findingSchema),
		previousActions: z.array(previousActionSchema).default([]),
	})
	.passthrough() as unknown as z.ZodType<IFCViewPayload, unknown>;

// Same partial-guard contract: validates/coerces ids and passes the remaining
// PreviousAction fields through untyped, typed to the domain shape it guards.
export const previousActionsSchema = z
	.array(previousActionSchema)
	.default([]) as unknown as z.ZodType<PreviousAction[], unknown>;

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
