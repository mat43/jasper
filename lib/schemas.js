// Zod schemas for all API request bodies.
// Import only what you need in each route file.

import { z } from 'zod'

// ── Reusable primitives ────────────────────────────────────────────────────────

/** Accepts string or number; coerces and validates as a positive float ≤ 100,000 */
const amountField = z.coerce
  .number({ invalid_type_error: 'amount must be a number' })
  .positive({ message: 'amount must be positive' })
  .max(100_000, { message: 'amount must be ≤ 100,000' })

const usernameField = z.string().min(1).max(50)

// ── Expense schemas ────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'description is required').max(200),
  amount:      amountField,
  category:    z.string().min(1).max(50),
  assignees:   z.array(usernameField).max(20).default([]),
  templateId:  z.number().int().positive().nullable().optional(),
})

export const patchExpenseSchema = z.object({
  paid: z.boolean({
    required_error:    'paid is required',
    invalid_type_error: 'paid must be a boolean',
  }),
})

// ── Grocery schemas ────────────────────────────────────────────────────────────

export const createGrocerySchema = z.object({
  label: z.string().min(1, 'label is required').max(200),
})

export const patchGrocerySchema = z.object({
  id:   z.string().min(1).max(50),
  done: z.boolean({ invalid_type_error: 'done must be a boolean' }),
})

export const deleteGrocerySchema = z.object({
  id: z.string().min(1).max(50),
})

// ── Template schemas ───────────────────────────────────────────────────────────

const dayOfWeekEnum = z.enum([
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
])

export const createTemplateSchema = z.object({
  description: z.string().min(1, 'description is required').max(200),
  amount:      amountField,
  category:    z.string().min(1).max(50),
  assignees:   z.array(usernameField).max(20).default([]),
  frequency:   z.enum(['weekly', 'monthly', 'once']),
  dayOfMonth:  z.number().int().min(1).max(31).nullable().optional(),
  dayOfWeek:   dayOfWeekEnum.nullable().optional(),
})

export const patchTemplateSchema = z
  .object({
    frequency:  z.enum(['weekly', 'monthly', 'once']).optional(),
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    dayOfWeek:  dayOfWeekEnum.nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' }
  )

// ── Profile schema ─────────────────────────────────────────────────────────────

export const patchProfileSchema = z
  .object({
    firstName: z.string().max(100).optional(),
    lastName:  z.string().max(100).optional(),
    email:     z.union([z.string().email(), z.literal('')]).optional(),
    venmo:     z.string().max(50).optional(),
    // base64 data URL or https URL; hard-capped to ~2 MB encoded
    avatar:    z.string().max(2_000_000).optional(),
    password:  z.string().min(8, 'password must be at least 8 characters').max(128).optional(),
    confirm:   z.string().optional(),
  })
  .refine(
    (data) => !data.password || data.password === data.confirm,
    { message: 'Passwords do not match', path: ['confirm'] }
  )
