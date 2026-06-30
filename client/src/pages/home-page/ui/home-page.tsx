import { useNavigate } from '@tanstack/react-router';

import {
  Alert,
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react';

import { yupResolver } from '@hookform/resolvers/yup';
import { useUnit } from 'effector-react';
import { Controller, useForm } from 'react-hook-form';

import { ROOM_NAME_MAX_LENGTH } from '@shared/types';

import {
  $createRoomError,
  $createRoomPending,
  createRoomFx,
} from '@/features/room';
import {
  homePageSchema,
  type ICreateRoomFormValues,
} from '../model/schemas/home-page-schema';

export const HomePage = () => {
  const navigate = useNavigate();

  const { createRoom, isCreating, createRoomError } = useUnit({
    createRoom: createRoomFx,
    isCreating: $createRoomPending,
    createRoomError: $createRoomError,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ICreateRoomFormValues>({
    resolver: yupResolver(homePageSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
    },
  });

  async function submit(values: ICreateRoomFormValues) {
    try {
      const room = await createRoom({
        name: values.name.trim(),
      });

      await navigate({
        to: '/rooms/$roomId',
        params: {
          roomId: room.id,
        },
      });
    } catch {}
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-lg">
        <Card.Header className="flex flex-col items-start gap-2">
          <div
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-2xl bg-accent text-xl text-accent-foreground"
          >
            ₽
          </div>

          <Card.Title className="text-3xl font-semibold">Делим счёт</Card.Title>

          <Card.Description className="text-base">
            Создайте комнату, добавьте участников и разделите общие расходы.
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <Form
            aria-label="Создание комнаты"
            className="flex w-full flex-col gap-5"
            validationBehavior="aria"
            onSubmit={handleSubmit(submit)}
          >
            {createRoomError && (
              <Alert status="danger">
                <Alert.Indicator />

                <Alert.Content>
                  <Alert.Title>Не удалось создать комнату</Alert.Title>

                  <Alert.Description>{createRoomError}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <TextField
                  isRequired
                  autoFocus
                  isInvalid={Boolean(errors.name)}
                  className="w-full"
                >
                  <Label>Название комнаты</Label>

                  <Input
                    value={field.value}
                    maxLength={ROOM_NAME_MAX_LENGTH}
                    placeholder="Например, поездка в Казань"
                    onBlur={field.onBlur}
                    onChange={event => {
                      field.onChange(event.target.value);
                    }}
                  />

                  <FieldError>{errors.name?.message}</FieldError>
                </TextField>
              )}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isPending={isCreating}
            >
              {isCreating ? 'Создаём комнату…' : 'Создать комнату'}
            </Button>
          </Form>
        </Card.Content>

        <Card.Footer className="justify-center">
          <p className="text-sm text-muted">Регистрация не требуется</p>
        </Card.Footer>
      </Card>
    </main>
  );
};
