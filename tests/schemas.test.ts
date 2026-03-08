import { describe, expect, it } from 'vitest';
import { assignmentSchema } from '../lib/schemas';

describe('assignmentSchema', () => {
  it('rejects end before start', () => {
    const result = assignmentSchema.safeParse({
      personId: 'p1',
      projectId: 'pr1',
      startDateTime: '2025-01-10T10:00:00.000Z',
      endDateTime: '2025-01-10T09:00:00.000Z',
      allocationHoursPerDay: 8
    });

    expect(result.success).toBe(false);
  });
});
