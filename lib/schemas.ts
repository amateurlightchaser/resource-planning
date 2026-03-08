import { ProjectStatus, TimeOffType } from '@prisma/client';
import { z } from 'zod';

export const personSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  team: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
  weeklyCapacityHours: z.number().int().min(1).max(80).default(40),
  isActive: z.boolean().default(true)
});

export const projectSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
  color: z.string().min(4),
  status: z.nativeEnum(ProjectStatus),
  client: z.string().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isArchived: z.boolean().optional()
});

export const assignmentSchema = z.object({
  personId: z.string().min(1),
  projectId: z.string().min(1),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  allocationHoursPerDay: z.number().min(0.25).max(24),
  notes: z.string().optional().nullable()
}).refine((data) => new Date(data.endDateTime) > new Date(data.startDateTime), {
  message: 'endDateTime must be after startDateTime',
  path: ['endDateTime']
});

export const timeOffSchema = z.object({
  personId: z.string().min(1),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  type: z.nativeEnum(TimeOffType),
  notes: z.string().optional().nullable()
}).refine((data) => new Date(data.endDateTime) > new Date(data.startDateTime), {
  message: 'endDateTime must be after startDateTime',
  path: ['endDateTime']
});
