export type ProgramResponse = {
	id: number
	extra?: Record<string, unknown>
	is_active: boolean
	created_at: string
	updated_at: string | null
	code: string
	modality_type_id: number
	name: { en: string; es: string }
	degree: string
}
