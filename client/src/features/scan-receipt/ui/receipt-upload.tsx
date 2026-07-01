import { useEffect, useRef, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useUnit } from 'effector-react';
import { useForm, useWatch } from 'react-hook-form';

import { Alert, Button, Card, Form, Label, ProgressBar } from '@heroui/react';

import {
  $detectedAmount,
  $ocrError,
  $ocrPending,
  $ocrProgress,
  $ocrResult,
  scanReceiptRequested,
  scanReceiptReset,
} from '../model/store/scan-receipt.store';
import {
  receiptUploadSchema,
  type IReceiptUploadFormValues,
} from '../model/schemas/receipt-upload-schema';

import { formatMoney } from '@/shared/lib/format-money';
import { ALLOWED_RECEIPT_TYPES } from '@/shared/consts/consts';
import { formatFileSize } from '@/shared/lib/format-file-size';

export const ReceiptUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    progress,
    result,
    detectedAmount,
    error,
    isPending,
    startScan,
    resetScan,
  } = useUnit({
    progress: $ocrProgress,
    result: $ocrResult,
    detectedAmount: $detectedAmount,
    error: $ocrError,
    isPending: $ocrPending,
    startScan: scanReceiptRequested,
    resetScan: scanReceiptReset,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<IReceiptUploadFormValues>({
    resolver: yupResolver(receiptUploadSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      receipt: undefined,
    },
  });

  const receipt = useWatch({
    control,
    name: 'receipt',
  });

  useEffect(() => {
    if (!receipt) {
      setPreviewUrl(null);

      return;
    }

    const objectUrl = URL.createObjectURL(receipt);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [receipt]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    resetScan();

    setValue('receipt', file, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const submit = (values: IReceiptUploadFormValues) => {
    if (!values.receipt) {
      return;
    }

    startScan(values.receipt);
  };

  const handleReset = () => {
    reset({
      receipt: undefined,
    });

    resetScan();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const progressColor =
    progress?.stage === 'error'
      ? 'danger'
      : progress?.stage === 'done'
        ? 'success'
        : 'accent';

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>Сканировать чек</Card.Title>

        <Card.Description>
          Загрузите фотографию чека, чтобы автоматически определить итоговую
          сумму.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <Form
          aria-label="Сканирование чека"
          validationBehavior="aria"
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(submit)}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_RECEIPT_TYPES.join(',')}
            className="sr-only"
            disabled={isPending}
            onChange={handleFileChange}
          />

          {previewUrl && receipt && (
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src={previewUrl}
                alt="Предпросмотр загруженного чека"
                className="max-h-80 w-full object-contain"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
                <span className="max-w-full truncate text-sm font-medium">
                  {receipt.name}
                </span>

                <span className="text-xs text-muted">
                  {formatFileSize(receipt.size)}
                </span>
              </div>
            </div>
          )}

          {errors.receipt?.message && (
            <Alert status="danger">
              <Alert.Indicator />

              <Alert.Content>
                <Alert.Title>Файл не подходит</Alert.Title>

                <Alert.Description>{errors.receipt.message}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {error && (
            <Alert status="danger">
              <Alert.Indicator />

              <Alert.Content>
                <Alert.Title>Ошибка распознавания</Alert.Title>

                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {progress && (
            <ProgressBar
              value={progress.value}
              minValue={0}
              maxValue={100}
              color={progressColor}
              className="w-full"
            >
              <Label>{progress.label}</Label>

              <ProgressBar.Output />

              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          )}

          {result && detectedAmount !== null && (
            <Alert status="success">
              <Alert.Indicator />

              <Alert.Content>
                <Alert.Title>Сумма найдена</Alert.Title>

                <Alert.Description>
                  В форму будет подставлено {formatMoney(detectedAmount)}
                </Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {result && detectedAmount === null && (
            <Alert status="warning">
              <Alert.Indicator />

              <Alert.Content>
                <Alert.Title>Сумма не найдена</Alert.Title>

                <Alert.Description>
                  Итоговую сумму определить не удалось. Убедитесь, что на
                  фотографии полностью видна нижняя часть чека со строкой
                  «ИТОГО» или «К ОПЛАТЕ».
                </Alert.Description>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Показать распознанный текст
                  </summary>

                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-default-100 p-3 text-xs">
                    {result.text}
                  </pre>
                </details>
              </Alert.Content>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              isDisabled={isPending}
              className="w-full sm:w-auto"
              onPress={openFileDialog}
            >
              {receipt ? 'Выбрать другой чек' : 'Выбрать изображение'}
            </Button>

            <Button
              type="submit"
              variant="primary"
              isPending={isPending}
              isDisabled={!receipt}
              className="w-full sm:w-auto"
            >
              {isPending ? 'Распознаём…' : 'Распознать чек'}
            </Button>

            {receipt && (
              <Button
                type="button"
                variant="ghost"
                isDisabled={isPending}
                className="w-full sm:w-auto"
                onPress={handleReset}
              >
                Очистить
              </Button>
            )}
          </div>
        </Form>
      </Card.Content>
    </Card>
  );
};
