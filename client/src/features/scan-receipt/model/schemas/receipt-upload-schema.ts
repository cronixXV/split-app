import {
  ALLOWED_RECEIPT_TYPES,
  MAX_RECEIPT_FILE_SIZE,
} from '@/shared/consts/consts';
import * as yup from 'yup';

export interface IReceiptUploadFormValues {
  receipt?: File;
}

export const receiptUploadSchema: yup.ObjectSchema<IReceiptUploadFormValues> =
  yup.object({
    receipt: yup
      .mixed<File>()
      .optional()
      .test(
        'receipt-required',
        'Выберите изображение чека',
        value => value instanceof File
      )
      .test(
        'receipt-type',
        'Поддерживаются только JPEG, PNG и WebP',
        value =>
          !value ||
          ALLOWED_RECEIPT_TYPES.includes(
            value.type as (typeof ALLOWED_RECEIPT_TYPES)[number]
          )
      )
      .test(
        'receipt-size',
        'Размер изображения не должен превышать 10 МБ',
        value => !value || value.size <= MAX_RECEIPT_FILE_SIZE
      ),
  });
