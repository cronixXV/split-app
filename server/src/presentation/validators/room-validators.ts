import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
});

export const addMemberSchema = z.object({
  name: z.string().min(2, 'Name is required').max(50),
});

export const createExpenseSchema = z.object({
  paidBy: z.string().uuid('paidBy must be a valid UUID'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(3, 'Description is required').max(200),
  split: z
    .array(z.string().uuid())
    .min(2, 'Split must include at least two members'),
});
