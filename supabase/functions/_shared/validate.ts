/**
 * Lightweight request body validation for Edge Functions.
 * No external dependencies — keeps cold-start times low.
 *
 * Usage:
 *   const result = validate(body, {
 *     title: { type: 'string', required: true, maxLength: 200 },
 *     score: { type: 'integer', required: true, min: 0, max: 10 },
 *   });
 *   if (!result.ok) return jsonError(result.error, 400);
 */

export type FieldRule =
  | { type: 'string'; required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp; trim?: boolean }
  | { type: 'integer'; required?: boolean; min?: number; max?: number }
  | { type: 'number'; required?: boolean; min?: number; max?: number }
  | { type: 'boolean'; required?: boolean }
  | { type: 'array'; required?: boolean; maxItems?: number }
  | { type: 'object'; required?: boolean };

export type Schema = Record<string, FieldRule>;

export type ValidateResult<T = Record<string, unknown>> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function validate<T extends Record<string, unknown>>(
  body: unknown,
  schema: Schema,
): ValidateResult<T> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const obj = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [field, rule] of Object.entries(schema)) {
    const raw = obj[field];
    const missing = raw === undefined || raw === null || raw === '';

    if (missing) {
      if (rule.required) return { ok: false, error: `Field '${field}' is required` };
      continue;
    }

    if (rule.type === 'string') {
      if (typeof raw !== 'string') return { ok: false, error: `Field '${field}' must be a string` };
      const val = rule.trim !== false ? raw.trim() : raw;
      if (rule.minLength !== undefined && val.length < rule.minLength)
        return { ok: false, error: `Field '${field}' must be at least ${rule.minLength} characters` };
      if (rule.maxLength !== undefined && val.length > rule.maxLength)
        return { ok: false, error: `Field '${field}' must be at most ${rule.maxLength} characters` };
      if (rule.pattern && !rule.pattern.test(val))
        return { ok: false, error: `Field '${field}' has an invalid format` };
      out[field] = val;
    } else if (rule.type === 'integer') {
      const n = Number(raw);
      if (!Number.isInteger(n)) return { ok: false, error: `Field '${field}' must be an integer` };
      if (rule.min !== undefined && n < rule.min)
        return { ok: false, error: `Field '${field}' must be >= ${rule.min}` };
      if (rule.max !== undefined && n > rule.max)
        return { ok: false, error: `Field '${field}' must be <= ${rule.max}` };
      out[field] = n;
    } else if (rule.type === 'number') {
      const n = Number(raw);
      if (isNaN(n)) return { ok: false, error: `Field '${field}' must be a number` };
      if (rule.min !== undefined && n < rule.min)
        return { ok: false, error: `Field '${field}' must be >= ${rule.min}` };
      if (rule.max !== undefined && n > rule.max)
        return { ok: false, error: `Field '${field}' must be <= ${rule.max}` };
      out[field] = n;
    } else if (rule.type === 'boolean') {
      if (typeof raw !== 'boolean') return { ok: false, error: `Field '${field}' must be a boolean` };
      out[field] = raw;
    } else if (rule.type === 'array') {
      if (!Array.isArray(raw)) return { ok: false, error: `Field '${field}' must be an array` };
      if (rule.maxItems !== undefined && raw.length > rule.maxItems)
        return { ok: false, error: `Field '${field}' must have at most ${rule.maxItems} items` };
      out[field] = raw;
    } else if (rule.type === 'object') {
      if (typeof raw !== 'object' || Array.isArray(raw))
        return { ok: false, error: `Field '${field}' must be an object` };
      out[field] = raw;
    }
  }

  return { ok: true, data: out as T };
}
