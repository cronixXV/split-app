import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import {
  Alert,
  Button,
  Card,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react';

import { type Member, MEMBER_NAME_MAX_LENGTH } from '@shared/types';

import {
  memberBarSchema,
  type IAddMemberFormValues,
} from '../model/schemas/member-bar-schema';

interface IMemberBarProps {
  members: Member[];
  onlineCount: number;
  isSocketConnected: boolean;
  isAddingMember: boolean;
  addMemberError: string | null;
  onAddMember: (name: string) => void;
}

export const MemberBar = ({
  members,
  onlineCount,
  isSocketConnected,
  isAddingMember,
  addMemberError,
  onAddMember,
}: IMemberBarProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IAddMemberFormValues>({
    resolver: yupResolver(memberBarSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
    },
  });

  function submit(values: IAddMemberFormValues) {
    onAddMember(values.name.trim());

    reset({
      name: '',
    });
  }

  return (
    <Card className="w-full">
      <Card.Header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title>Участники</Card.Title>

          <Card.Description>
            Добавьте людей, которые участвуют в общих расходах.
          </Card.Description>
        </div>

        <Chip
          color={isSocketConnected ? 'success' : 'danger'}
          variant="soft"
          size="sm"
        >
          {isSocketConnected ? `Онлайн: ${onlineCount}` : 'Нет соединения'}
        </Chip>
      </Card.Header>

      <Card.Content className="flex flex-col gap-5">
        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Участников пока нет
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map(member => {
              const isTemporary = member.id.startsWith('temp:');

              return (
                <Chip
                  key={member.id}
                  color={isTemporary ? 'accent' : 'default'}
                  variant="soft"
                >
                  {isTemporary ? `${member.name} · добавляется` : member.name}
                </Chip>
              );
            })}
          </div>
        )}

        <Form
          aria-label="Добавление участника"
          validationBehavior="aria"
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
          onSubmit={handleSubmit(submit)}
        >
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                isRequired
                isInvalid={Boolean(errors.name)}
                className="w-full flex-1"
              >
                <Label>Имя участника</Label>

                <Input
                  value={field.value}
                  maxLength={MEMBER_NAME_MAX_LENGTH}
                  placeholder="Например, Анна"
                  disabled={isAddingMember}
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
            className="sm:mt-6"
            isPending={isAddingMember}
          >
            {isAddingMember ? 'Добавляем…' : 'Добавить'}
          </Button>
        </Form>

        {addMemberError && (
          <Alert status="danger">
            <Alert.Indicator />

            <Alert.Content>
              <Alert.Title>Не удалось добавить участника</Alert.Title>

              <Alert.Description>{addMemberError}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </Card.Content>
    </Card>
  );
};
