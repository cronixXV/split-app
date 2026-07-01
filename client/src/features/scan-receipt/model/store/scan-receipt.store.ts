import {
  createEffect,
  createEvent,
  createStore,
  sample,
  scopeBind,
} from 'effector';

import { recognizeReceipt } from '../../lib/ocr-worker';
import { parseReceiptTotal } from '../../lib/parse-receipt-total';
import type { IOcrProgress, IOcrResult } from '../types/ocr-worker.types';

export const scanReceiptRequested = createEvent<File>();
export const scanReceiptReset = createEvent();
const scanReceiptStarted = createEvent<File>();
const ocrProgressChanged = createEvent<IOcrProgress>();
const receiptTotalDetected = createEvent<number | null>();

export const ocrFx = createEffect<File, IOcrResult>(file => {
  const progressChanged = scopeBind(ocrProgressChanged);

  return recognizeReceipt(file, progressChanged);
});

export const $ocrProgress = createStore<IOcrProgress | null>(null)
  .on(scanReceiptStarted, () => ({
    stage: 'loading',
    value: 0,
    label: 'Подготавливаем OCR…',
  }))
  .on(ocrProgressChanged, (_, progress) => progress)
  .on(ocrFx.done, () => ({
    stage: 'done',
    value: 100,
    label: 'Чек распознан',
  }))
  .on(ocrFx.fail, progress => ({
    stage: 'error',
    value: progress?.value ?? 0,
    label: 'Не удалось распознать чек',
  }))
  .reset(scanReceiptReset);

export const $ocrResult = createStore<IOcrResult | null>(null)
  .on(ocrFx.doneData, (_, result) => result)
  .reset([scanReceiptStarted, scanReceiptReset]);

export const $ocrError = createStore<string | null>(null)
  .on(
    ocrFx.failData,
    (_, error) => error.message || 'Не удалось распознать чек'
  )
  .reset([scanReceiptStarted, scanReceiptReset]);

export const $ocrPending = ocrFx.pending;

export const $detectedAmount = createStore<number | null>(null)
  .on(receiptTotalDetected, (_, amount) => amount)
  .reset([scanReceiptStarted, scanReceiptReset]);

sample({
  clock: scanReceiptRequested,
  source: $ocrPending,
  filter: isPending => !isPending,
  fn: (_, file) => file,
  target: [scanReceiptStarted, ocrFx],
});

sample({
  clock: ocrFx.doneData,
  fn: result => parseReceiptTotal(result.text),
  target: receiptTotalDetected,
});
