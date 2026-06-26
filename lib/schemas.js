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
  // The payer. Only honored for admins (see route); ignored for everyone else.
  createdBy:   usernameField.optional(),
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
  // The payer. Only honored for admins (see route); ignored for everyone else.
  createdBy:   usernameField.optional(),
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

// ── Health schemas ─────────────────────────────────────────────────────────────

export const patchHealthProfileSchema = z.object({
  dailyCalorieGoal: z.number().int().min(500).max(10000).optional(),
  proteinGoal:      z.number().int().min(0).max(500).optional(),
  carbGoal:         z.number().int().min(0).max(1000).optional(),
  fatGoal:          z.number().int().min(0).max(500).optional(),
  fiberGoal:        z.number().int().min(0).max(200).optional(),
  waterGoal:        z.number().int().min(0).max(500).optional(),
})

export const createFoodItemSchema = z.object({
  name:        z.string().min(1, 'name is required').max(200),
  brand:       z.string().max(100).optional(),
  calories:    z.number().int().min(0).max(5000),
  protein:     z.number().min(0).max(500),
  carbs:       z.number().min(0).max(1000),
  fat:         z.number().min(0).max(500),
  fiber:       z.number().min(0).max(200).optional().default(0),
  sugar:       z.number().min(0).max(500).optional().default(0),
  servingSize: z.number().positive().max(10000).optional().default(1),
  servingUnit: z.string().min(1).max(50).optional().default('serving'),
})

export const createFoodLogSchema = z.object({
  foodItemId:  z.number().int().positive(),
  mealType:    z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings:    z.number().positive().max(50).default(1),
  logDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid date format'),
  note:        z.string().max(500).optional(),
  aiGenerated: z.boolean().optional().default(false),
  photoUrl:    z.string().url().optional(),
})

export const createPresetMealSchema = z.object({
  name:  z.string().min(1, 'name is required').max(200),
  items: z.array(z.object({
    foodItemId: z.number().int().positive(),
    servings:   z.number().positive().max(50),
    // Preserved so logging a preset restores each item to its original meal.
    mealType:   z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  })).min(1).max(20),
})

export const createWeightLogSchema = z.object({
  weight: z.number().positive().max(1500),
})

export const createWaterLogSchema = z.object({
  // Positive adds water, negative undoes; the route clamps the daily total at 0.
  amount:  z.number().int().min(-500).max(500),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid date format'),
})

export const analyzePhotoSchema = z.object({
  imageData:   z.string().min(1).max(10_000_000).optional(),
  mimeType:    z.string().optional().default('image/jpeg'),
  context:     z.string().max(500).optional(),
  description: z.string().min(1).max(1000).optional(),
}).refine(d => d.imageData || d.description, { message: 'Either imageData or description is required' })

// ── Profile schema ─────────────────────────────────────────────────────────────

export const patchProfileSchema = z
  .object({
    firstName: z.string().max(100).optional(),
    lastName:  z.string().max(100).optional(),
    email:     z.union([z.string().email(), z.literal('')]).optional(),
    venmo:     z.string().max(50).optional(),
    // base64 data URL or https URL; hard-capped to ~10 MB encoded
    avatar:    z.string().max(10_000_000).optional(),
    password:  z.string().min(8, 'password must be at least 8 characters').max(128).optional(),
    confirm:   z.string().optional(),
  })
  .refine(
    (data) => !data.password || data.password === data.confirm,
    { message: 'Passwords do not match', path: ['confirm'] }
  )
