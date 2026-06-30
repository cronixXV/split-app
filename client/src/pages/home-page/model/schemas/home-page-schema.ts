import * as yup from 'yup';

import { ROOM_NAME_MAX_LENGTH, ROOM_NAME_MIN_LENGTH } from '@shared/types';

export interface ICreateRoomFormValues {
  name: string;
}
export const homePageSchema: yup.ObjectSchema<ICreateRoomFormValues> =
  yup.object({
    name: yup
      .string()
      .trim()
      .required('Введите название комнаты')
      .min(ROOM_NAME_MIN_LENGTH, `Минимум ${ROOM_NAME_MIN_LENGTH} символа`)
      .max(ROOM_NAME_MAX_LENGTH, `Максимум ${ROOM_NAME_MAX_LENGTH} символов`),
  });
