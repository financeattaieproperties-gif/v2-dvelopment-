import { describe, expect, it } from 'vitest';
import {
  DAY,
  createCustomerSerial,
  createLeadStageSerial,
  feedbackDeadline,
  followupState,
  formatDateSuffix,
  normalizePhone,
  resolveCustomerRegistration,
  taskState,
  validateFeedback,
} from '../workflow.mjs';

describe('packages/staff-contracts/workflow — Lead Deduplication', () => {
  describe('normalizePhone', () => {
    it('normalizes equivalent Afghan mobile formats to +937XXXXXXXX', () => {
      const variants = [
        '0782222279',
        '078 222 2279',
        '078-222-2279',
        '+93782222279',
        '+93 78 222 2279',
        '93782222279',
        '0093782222279',
        '0093 (78) 222-2279',
      ];

      for (const raw of variants) {
        expect(normalizePhone(raw)).toBe('+93782222279');
      }
    });

    it('rejects non-Afghan, non-mobile, or malformed phone numbers', () => {
      const invalidInputs = [
        '',
        '   ',
        '12345',
        '078222227', // 9 digits (too short)
        '07822222790', // 11 digits (too long)
        '0202222279', // Kabul landline (not 07...)
        '+93202222279', // landline with +93
        '+14155552671', // US number
        'abc078222227', // non-93 prefix after stripping letters
      ];

      for (const bad of invalidInputs) {
        expect(() => normalizePhone(bad)).toThrowError(
          'Enter a valid Afghan mobile number.',
        );
      }
    });
  });

  describe('resolveCustomerRegistration', () => {
    const fixedDate = '2026-11-11T10:00:00.000Z';

    it('creates a new customer with trimmed fields and Kabul-dated serial when phone is unique', () => {
      const masterCustomers = [
        {
          id: 1,
          serial: 'CA01-C1-101126',
          name: 'Existing Client',
          phone: '+93700111222',
          requirements: '2-bed apartment',
          leadCount: 1,
          ownerAgentId: 2,
          sharedAgentIds: [],
        },
      ];

      const result = resolveCustomerRegistration(masterCustomers, {
        name: '  Haji Ahmad Shah  ',
        phone: '078 222 2279',
        requirements: '  4-bed villa in Wazir Akbar Khan  ',
        agentId: 7,
        agentName: 'Samiullah',
        agentPrefix: 'SA',
        date: fixedDate,
      });

      expect(result).toEqual({
        outcome: 'created',
        redacted: false,
        reviewRequest: null,
        customer: {
          id: 2,
          serial: 'SA07-C2-111126',
          name: 'Haji Ahmad Shah',
          phone: '+93782222279',
          requirements: '4-bed villa in Wazir Akbar Khan',
          leadCount: 1,
          ownerAgentId: 7,
          sharedAgentIds: [],
        },
      });
    });

    it('uses default agentPrefix (CA) and empty requirements when optional args are omitted', () => {
      const result = resolveCustomerRegistration([], {
        name: 'Bilal Noori',
        phone: '+93799123456',
        agentId: 3,
        date: fixedDate,
      });

      expect(result.outcome).toBe('created');
      expect(result.customer).toMatchObject({
        id: 1,
        serial: 'CA03-C1-111126',
        name: 'Bilal Noori',
        phone: '+93799123456',
        requirements: '',
        leadCount: 1,
        ownerAgentId: 3,
        sharedAgentIds: [],
      });
    });

    it('links back to the existing customer when the owner agent submits an equivalent phone format', () => {
      const existing = {
        id: 12,
        serial: 'CA04-C12-011126',
        name: 'Mirwais Azizi',
        phone: '+93700112233',
        requirements: '3-bed apartment',
        leadCount: 2,
        ownerAgentId: 4,
        sharedAgentIds: [],
      };

      const result = resolveCustomerRegistration([existing], {
        name: 'Mirwais Azizi',
        phone: '0093 70 011 2233',
        requirements: 'Updated budget',
        agentId: 4,
        agentName: 'Farid',
        agentPrefix: 'CA',
        date: fixedDate,
      });

      expect(result).toEqual({
        outcome: 'linked_owned',
        customer: existing,
        redacted: false,
        reviewRequest: null,
      });
    });

    it('links without redaction when the registering agent is in sharedAgentIds', () => {
      const existing = {
        id: 5,
        serial: 'CA02-C5-051126',
        name: 'Zahra Karimi',
        phone: '+93781234567',
        requirements: 'Commercial office space',
        leadCount: 1,
        ownerAgentId: 2,
        sharedAgentIds: [9, 14],
      };

      const result = resolveCustomerRegistration([existing], {
        name: 'Zahra Karimi',
        phone: '0781-234-567',
        requirements: 'Follow-up viewing',
        agentId: 9,
        agentName: 'Mariam',
        agentPrefix: 'SA',
        date: fixedDate,
      });

      expect(result).toEqual({
        outcome: 'linked_owned',
        customer: existing,
        redacted: false,
        reviewRequest: null,
      });
    });

    it('redacts customer details and creates a pending_review request on cross-agent duplicate conflict', () => {
      const existing = {
        id: 21,
        serial: 'CA02-C21-101126',
        name: 'Confidential VIP Client',
        phone: '+93700112233',
        requirements: 'Penthouse',
        leadCount: 1,
        ownerAgentId: 2,
        sharedAgentIds: [5],
      };

      const result = resolveCustomerRegistration([existing], {
        name: '  Mirwais A.  ',
        phone: '070 011 2233',
        requirements: '  4-bed in Kabul Plaza 12  ',
        agentId: 8,
        agentName: 'Samiullah',
        agentPrefix: 'SA',
        date: fixedDate,
      });

      expect(result).toEqual({
        outcome: 'duplicate_conflict',
        customer: null,
        redacted: true,
        reviewRequest: {
          customerId: 21,
          phone: '+93700112233',
          requestingAgentId: 8,
          requestingAgentName: 'Samiullah',
          submittedName: 'Mirwais A.',
          submittedRequirements: '4-bed in Kabul Plaza 12',
          status: 'pending_review',
          createdAt: fixedDate,
        },
      });
    });

    it('treats missing sharedAgentIds safely as no shared agents on conflict', () => {
      const existingWithoutSharedArray = {
        id: 3,
        serial: 'CA01-C3-101126',
        name: 'Nadia Stanikzai',
        phone: '+93771234567',
        ownerAgentId: 1,
      };

      const result = resolveCustomerRegistration([existingWithoutSharedArray], {
        name: 'Nadia',
        phone: '+93 77 123 4567',
        agentId: 6,
        date: fixedDate,
      });

      expect(result.outcome).toBe('duplicate_conflict');
      expect(result.customer).toBeNull();
      expect(result.redacted).toBe(true);
      expect(result.reviewRequest?.requestingAgentName).toBe('Agent');
      expect(result.reviewRequest?.customerId).toBe(3);
    });

    it('propagates phone validation errors before inspecting masterCustomers', () => {
      expect(() =>
        resolveCustomerRegistration([], {
          name: 'Invalid Lead',
          phone: '0202101010',
          agentId: 1,
          date: fixedDate,
        }),
      ).toThrowError('Enter a valid Afghan mobile number.');
    });
  });

  describe('Serial & Kabul Date Formatting Helpers', () => {
    it('formats dates in Asia/Kabul (+04:30) timezone for deduplication serials', () => {
      // 20:00 UTC on Nov 10 is 00:30 on Nov 11 in Asia/Kabul (+04:30)
      expect(formatDateSuffix('2026-11-10T20:00:00.000Z')).toBe('111126');
      expect(createCustomerSerial('CA', 2, 15, '2026-11-10T20:00:00.000Z')).toBe(
        'CA02-C15-111126',
      );
      expect(
        createLeadStageSerial({
          prefix: 'SA',
          agentId: 12,
          sequence: 4,
          stage: 'DC',
          date: '2026-11-10T20:00:00.000Z',
        }),
      ).toBe('SA12-DC4-111126');
    });
  });
});

describe('packages/staff-contracts/workflow — Follow-up State Calculation', () => {
  const scheduledAt = '2026-11-10T05:30:00.000Z';
  const exactDeadline = '2026-11-11T05:30:00.000Z';

  describe('feedbackDeadline', () => {
    it('defines a 24-hour (86,400,000 ms) SLA grace window', () => {
      expect(DAY).toBe(24 * 60 * 60 * 1000);
      expect(feedbackDeadline(scheduledAt)).toBe(exactDeadline);
    });

    it('handles timezone offsets and month/year boundaries cleanly', () => {
      // 2026-12-31 23:00 Kabul (+04:30) == 2026-12-31T18:30:00.000Z
      expect(feedbackDeadline('2026-12-31T23:00:00+04:30')).toBe(
        '2027-01-01T18:30:00.000Z',
      );
    });
  });

  describe('followupState — uncompleted follow-ups', () => {
    const openTask = { scheduledAt, completedAt: null };

    it('returns "upcoming" strictly before scheduledAt', () => {
      expect(followupState(openTask, '2026-11-10T00:00:00.000Z')).toBe('upcoming');
      expect(followupState(openTask, '2026-11-10T05:29:59.999Z')).toBe('upcoming');
    });

    it('returns "due" from exact scheduledAt through exact 24h feedbackDeadline inclusive', () => {
      expect(followupState(openTask, scheduledAt)).toBe('due');
      expect(followupState(openTask, '2026-11-10T17:30:00.000Z')).toBe('due');
      expect(followupState(openTask, exactDeadline)).toBe('due');
    });

    it('returns "overtime" strictly after the 24h feedbackDeadline', () => {
      expect(followupState(openTask, '2026-11-11T05:30:00.001Z')).toBe('overtime');
      expect(followupState(openTask, '2026-11-15T12:00:00.000Z')).toBe('overtime');
    });

    it('supports undefined completedAt and timezone-offset timestamps', () => {
      const taskWithOffset = { scheduledAt: '2026-11-10T10:00:00+04:30' }; // 05:30Z
      expect(followupState(taskWithOffset, '2026-11-10T05:29:59.000Z')).toBe('upcoming');
      expect(followupState(taskWithOffset, '2026-11-11T05:30:00.000Z')).toBe('due');
      expect(followupState(taskWithOffset, '2026-11-11T05:30:00.001Z')).toBe('overtime');
    });
  });

  describe('followupState — completed follow-ups', () => {
    it('returns "completed" when completed before, during, or exactly at the 24h deadline', () => {
      expect(
        followupState({ scheduledAt, completedAt: '2026-11-10T04:00:00.000Z' }),
      ).toBe('completed');
      expect(
        followupState({ scheduledAt, completedAt: '2026-11-10T12:00:00.000Z' }),
      ).toBe('completed');
      expect(
        followupState({ scheduledAt, completedAt: exactDeadline }),
      ).toBe('completed');
    });

    it('returns "completed_late" strictly after the 24h deadline', () => {
      expect(
        followupState({ scheduledAt, completedAt: '2026-11-11T05:30:00.001Z' }),
      ).toBe('completed_late');
      expect(
        followupState({ scheduledAt, completedAt: '2026-11-12T08:00:00.000Z' }),
      ).toBe('completed_late');
    });

    it('bases completed state strictly on completedAt regardless of current "now"', () => {
      // Completed late checked against an earlier "now" still reports completed_late
      expect(
        followupState(
          { scheduledAt, completedAt: '2026-11-11T05:30:01.000Z' },
          scheduledAt,
        ),
      ).toBe('completed_late');

      // Completed on time checked days later still reports completed
      expect(
        followupState(
          { scheduledAt, completedAt: exactDeadline },
          '2026-12-01T00:00:00.000Z',
        ),
      ).toBe('completed');
    });
  });

  describe('taskState & validateFeedback boundaries', () => {
    it('marks non-terminal management tasks as overdue immediately after deadlineAt', () => {
      expect(
        taskState({ deadlineAt: scheduledAt, status: 'todo' }, scheduledAt),
      ).toBe('todo');
      expect(
        taskState(
          { deadlineAt: scheduledAt, status: 'todo' },
          '2026-11-10T05:30:00.001Z',
        ),
      ).toBe('overdue');
      expect(
        taskState(
          { deadlineAt: scheduledAt, status: 'completed' },
          '2026-11-10T05:30:00.001Z',
        ),
      ).toBe('completed');
      expect(
        taskState(
          { deadlineAt: scheduledAt, status: 'cancelled' },
          '2026-11-10T05:30:00.001Z',
        ),
      ).toBe('cancelled');
    });

    it('enforces role and scheduling rules for follow-up feedback', () => {
      expect(() =>
        validateFeedback(
          {
            outcome: 'followup',
            notes: 'Client asked for brochure',
            nextScheduledAt: scheduledAt,
            nextAssigneeId: 2,
          },
          'callcenter',
          scheduledAt,
        ),
      ).toThrowError('Choose a next follow-up date and time in the future.');

      expect(
        validateFeedback(
          {
            outcome: 'followup',
            notes: 'Scheduled tomorrow',
            nextScheduledAt: exactDeadline,
            nextAssigneeId: 2,
          },
          'callcenter',
          scheduledAt,
        ),
      ).toMatchObject({ outcome: 'followup', nextAssigneeId: 2 });
    });
  });
});
