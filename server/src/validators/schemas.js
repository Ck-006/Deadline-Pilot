import { z } from 'zod'

const validDate = z.string().min(1).refine((value) => Number.isFinite(new Date(value).getTime()), 'Enter a valid due date and time.')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: z.email().trim().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
}).strict()

export const loginSchema = z.object({
  email: z.email().trim().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict()

const assignmentFields = {
  title: z.string().trim().min(1, 'Title is required.').max(120),
  description: z.string().trim().max(2000).optional().default(''),
  course: z.string().trim().min(1, 'Course is required.').max(80),
  dueAt: validDate.transform((value) => new Date(value)),
  estimatedHours: z.union([z.literal(''), z.number(), z.string().trim().regex(/^\d+(\.\d{1,2})?$/).transform(Number)]).nullable().optional()
    .transform((value) => value === '' || value === undefined ? null : value)
    .refine((value) => value === null || (Number.isFinite(value) && value >= 0 && value <= 500), 'Effort must be between 0 and 500 hours.'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'completed']).default('pending'),
}

export const createAssignmentSchema = z.object(assignmentFields).strict()
export const updateAssignmentSchema = z.object({
  title: assignmentFields.title.optional(),
  description: z.string().trim().max(2000).optional(),
  course: assignmentFields.course.optional(),
  dueAt: validDate.transform((value) => new Date(value)).optional(),
  estimatedHours: z.union([z.literal(''), z.number(), z.string().trim().regex(/^\d+(\.\d{1,2})?$/).transform(Number)]).nullable().optional()
    .refine((value) => value === undefined || value === '' || value === null || (Number.isFinite(value) && value >= 0 && value <= 500), 'Effort must be between 0 and 500 hours.'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'completed']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')
