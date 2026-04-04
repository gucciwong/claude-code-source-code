import { z } from 'zod'

/**
 * Validates an API response against a Zod schema.
 * Returns the parsed data on success, throws on validation failure.
 */
export function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data)
}
