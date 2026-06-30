import * as yup from 'yup';

import {
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_DESCRIPTION_MIN_LENGTH,
  MAX_EXPENSE_AMOUNT,
} from '@shared/types';

export interface IExpenseFormValues {
  description: string;
  amount: number;
  paidBy: string;
  split: string[];
}

export const expenseFormSchema: yup.ObjectSchema<IExpenseFormValues> =
  yup.object({
    description: yup
      .string()
      .trim()
      .required('Введите описание')
      .min(
        EXPENSE_DESCRIPTION_MIN_LENGTH,
        `Минимум ${EXPENSE_DESCRIPTION_MIN_LENGTH} символа`
      )
      .max(
        EXPENSE_DESCRIPTION_MAX_LENGTH,
        `Максимум ${EXPENSE_DESCRIPTION_MAX_LENGTH} символов`
      ),

    amount: yup
      .number()
      .typeError('Введите сумму')
      .required('Введите сумму')
      .moreThan(0, 'Сумма должна быть больше 0')
      .max(MAX_EXPENSE_AMOUNT, `Максимум ${MAX_EXPENSE_AMOUNT}`),

    paidBy: yup.string().required('Выберите, кто оплатил расход'),

    split: yup
      .array()
      .of(yup.string().required())
      .min(1, 'Выберите хотя бы одного участника')
      .required('Выберите участников'),
  });
