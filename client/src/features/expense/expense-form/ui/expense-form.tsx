import { useEffect, useMemo, useRef } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import {
  Alert,
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  TextField,
} from '@heroui/react';

import {
  MAX_EXPENSE_AMOUNT,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  type CreateExpenseDto,
  type Member,
} from '@shared/types';

import {
  expenseFormSchema,
  type IExpenseFormValues,
} from '../model/schemas/expense-form-schema';

interface IExpenseFormProps {
  members: Member[];
  isSaving: boolean;
  saveExpenseError: string | null;
  onSaveExpense: (dto: CreateExpenseDto) => void;
}

export const ExpenseForm = ({
  members,
  isSaving,
  saveExpenseError,
  onSaveExpense,
}: IExpenseFormProps) => {
  const confirmedMembers = useMemo(
    () => members.filter(member => !member.id.startsWith('temp:')),
    [members]
  );

  const wasSavingRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<IExpenseFormValues>({
    resolver: yupResolver(expenseFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      amount: 0.01,
      paidBy: '',
      split: [],
    },
  });

  useEffect(() => {
    const memberIds = new Set(confirmedMembers.map(member => member.id));

    const currentPaidBy = getValues('paidBy');
    const currentSplit = getValues('split');

    if (!currentPaidBy || !memberIds.has(currentPaidBy)) {
      setValue('paidBy', confirmedMembers[0]?.id ?? '', {
        shouldValidate: false,
        shouldDirty: false,
      });
    }

    const validSplit = currentSplit.filter(id => memberIds.has(id));

    setValue(
      'split',
      validSplit.length > 0
        ? validSplit
        : confirmedMembers.map(member => member.id),
      {
        shouldValidate: false,
        shouldDirty: false,
      }
    );
  }, [confirmedMembers, getValues, setValue]);

  useEffect(() => {
    const wasSaving = wasSavingRef.current;

    if (wasSaving && !isSaving && saveExpenseError === null) {
      const defaultSplit = confirmedMembers.map(member => member.id);

      reset({
        description: '',
        amount: 0.01,
        paidBy: confirmedMembers[0]?.id ?? '',
        split: defaultSplit,
      });
    }

    wasSavingRef.current = isSaving;
  }, [confirmedMembers, isSaving, reset, saveExpenseError]);

  function submit(values: IExpenseFormValues) {
    onSaveExpense({
      description: values.description.trim(),
      amount: values.amount,
      paidBy: values.paidBy,
      split: [...values.split],
    });
  }

  if (confirmedMembers.length === 0) {
    return (
      <Card className="w-full">
        <Card.Header>
          <Card.Title>Новый расход</Card.Title>

          <Card.Description>
            Добавьте хотя бы одного участника, чтобы создать расход.
          </Card.Description>
        </Card.Header>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>Новый расход</Card.Title>

        <Card.Description>
          Укажите сумму, плательщика и участников расхода.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <Form
          aria-label="Добавление расхода"
          validationBehavior="aria"
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(submit)}
        >
          {saveExpenseError && (
            <Alert status="danger">
              <Alert.Indicator />

              <Alert.Content>
                <Alert.Title>Не удалось сохранить расход</Alert.Title>

                <Alert.Description>{saveExpenseError}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextField
                  isRequired
                  isDisabled={isSaving}
                  isInvalid={Boolean(errors.description)}
                  className="w-full"
                >
                  <Label>Описание</Label>

                  <Input
                    value={field.value}
                    maxLength={EXPENSE_DESCRIPTION_MAX_LENGTH}
                    placeholder="Например, ужин"
                    onBlur={field.onBlur}
                    onChange={event => {
                      field.onChange(event.target.value);
                    }}
                  />

                  <FieldError>{errors.description?.message}</FieldError>
                </TextField>
              )}
            />

            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <NumberField
                  isRequired
                  isDisabled={isSaving}
                  isInvalid={Boolean(errors.amount)}
                  value={field.value}
                  minValue={0.01}
                  maxValue={MAX_EXPENSE_AMOUNT}
                  step={0.01}
                  className="w-full"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                >
                  <Label>Сумма</Label>

                  <NumberField.Group>
                    <NumberField.DecrementButton />

                    <NumberField.Input />

                    <NumberField.IncrementButton />
                  </NumberField.Group>

                  <FieldError>{errors.amount?.message}</FieldError>
                </NumberField>
              )}
            />
          </div>

          <Controller
            control={control}
            name="paidBy"
            render={({ field }) => (
              <Select
                isRequired
                isDisabled={isSaving}
                isInvalid={Boolean(errors.paidBy)}
                value={field.value || null}
                placeholder="Выберите участника"
                className="w-full"
                onBlur={field.onBlur}
                onChange={value => {
                  field.onChange(value === null ? '' : String(value));
                }}
              >
                <Label>Кто заплатил</Label>

                <Select.Trigger>
                  <Select.Value />

                  <Select.Indicator />
                </Select.Trigger>

                <Select.Popover>
                  <ListBox>
                    {confirmedMembers.map(member => (
                      <ListBox.Item
                        key={member.id}
                        id={member.id}
                        textValue={member.name}
                      >
                        {member.name}

                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>

                <FieldError>{errors.paidBy?.message}</FieldError>
              </Select>
            )}
          />

          <Controller
            control={control}
            name="split"
            render={({ field }) => (
              <CheckboxGroup
                isRequired
                isDisabled={isSaving}
                isInvalid={Boolean(errors.split)}
                name={field.name}
                value={field.value}
                className="gap-3"
                onBlur={field.onBlur}
                onChange={field.onChange}
              >
                <Label>Кто участвует в расходе</Label>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {confirmedMembers.map(member => (
                    <Checkbox
                      key={member.id}
                      value={member.id}
                      variant="secondary"
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>

                        {member.name}
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                </div>

                <FieldError>{errors.split?.message}</FieldError>
              </CheckboxGroup>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            isPending={isSaving}
            className="w-full sm:w-fit"
          >
            {isSaving ? 'Сохраняем…' : 'Добавить расход'}
          </Button>
        </Form>
      </Card.Content>
    </Card>
  );
};
