export interface IExpenseEntity {
  id: string;
  roomId: string;
  paidBy: string;
  amount: number;
  description: string;
  split: string[];
  createdAt: Date;
}
