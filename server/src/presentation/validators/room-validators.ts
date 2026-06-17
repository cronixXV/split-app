import {
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_DESCRIPTION_MIN_LENGTH,
  MAX_EXPENSE_AMOUNT,
  MEMBER_NAME_MAX_LENGTH,
  MEMBER_NAME_MIN_LENGTH,
  ROOM_NAME_MAX_LENGTH,
  ROOM_NAME_MIN_LENGTH,
} from '@shared/types';

import { z } from 'zod';

import { hasAtMostTwoDecimalPlaces } from '../../domain/validation/money-validation';

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      ROOM_NAME_MIN_LENGTH,
      `Name must contain at least ${ROOM_NAME_MIN_LENGTH} characters`
    )
    .max(
      ROOM_NAME_MAX_LENGTH,
      `Name must contain no more than ${ROOM_NAME_MAX_LENGTH} characters`
    ),
});

export const addMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      MEMBER_NAME_MIN_LENGTH,
      `Name must contain at least ${MEMBER_NAME_MIN_LENGTH} characters`
    )
    .max(
      MEMBER_NAME_MAX_LENGTH,
      `Name must contain no more than ${MEMBER_NAME_MAX_LENGTH} characters`
    ),
});

export const createExpenseSchema = z.object({
  paidBy: z.string().uuid('paidBy must be a valid UUID'),

  amount: z
    .number()
    .finite('Amount must be a finite number')
    .positive('Amount must be positive')
    .max(MAX_EXPENSE_AMOUNT, `Amount must not exceed ${MAX_EXPENSE_AMOUNT}`)
    .refine(hasAtMostTwoDecimalPlaces, {
      message: 'Amount must contain no more than two decimal places',
    }),

  description: z
    .string()
    .trim()
    .min(
      EXPENSE_DESCRIPTION_MIN_LENGTH,
      `Description must contain at least ${EXPENSE_DESCRIPTION_MIN_LENGTH} characters`
    )
    .max(
      EXPENSE_DESCRIPTION_MAX_LENGTH,
      `Description must contain no more than ${EXPENSE_DESCRIPTION_MAX_LENGTH} characters`
    ),

  split: z
    .array(z.string().uuid())
    .min(1, 'Split must include at least one member')
    .refine(memberIds => new Set(memberIds).size === memberIds.length, {
      message: 'Split members must be unique',
    }),
});
