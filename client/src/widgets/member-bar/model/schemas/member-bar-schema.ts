import * as yup from 'yup';

import { MEMBER_NAME_MAX_LENGTH, MEMBER_NAME_MIN_LENGTH } from '@shared/types';

export interface IAddMemberFormValues {
  name: string;
}

export const memberBarSchema: yup.ObjectSchema<IAddMemberFormValues> =
  yup.object({
    name: yup
      .string()
      .trim()
      .required('Введите имя участника')
      .min(MEMBER_NAME_MIN_LENGTH, `Минимум ${MEMBER_NAME_MIN_LENGTH} символа`)
      .max(
        MEMBER_NAME_MAX_LENGTH,
        `Максимум ${MEMBER_NAME_MAX_LENGTH} символов`
      ),
  });
