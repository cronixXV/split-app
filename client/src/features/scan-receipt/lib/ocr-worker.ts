import type { LoggerMessage, Worker } from 'tesseract.js';

import type { IOcrProgress, IOcrResult } from '../model/types/ocr-worker.types';

type TProgressListener = (progress: IOcrProgress) => void;

let workerPromise: Promise<Worker> | null = null;

let activeProgressListener: TProgressListener | null = null;

let isRecognitionInProgress = false;

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeProgress(message: LoggerMessage): IOcrProgress {
  const progress = Number.isFinite(message.progress) ? message.progress : 0;

  switch (message.status) {
    case 'loading tesseract core':
      return {
        stage: 'loading',
        value: clampProgress(progress * 10),
        label: 'Загружаем OCR-ядро…',
      };

    case 'loaded tesseract core':
      return {
        stage: 'loading',
        value: 10,
        label: 'OCR-ядро загружено',
      };

    case 'initializing tesseract':
      return {
        stage: 'loading',
        value: clampProgress(10 + progress * 10),
        label: 'Инициализируем OCR…',
      };

    case 'initialized tesseract':
      return {
        stage: 'loading',
        value: 20,
        label: 'OCR инициализирован',
      };

    case 'loading language traineddata':
      return {
        stage: 'loading',
        value: clampProgress(20 + progress * 25),
        label: 'Загружаем языковые модели…',
      };

    case 'loaded language traineddata':
      return {
        stage: 'loading',
        value: 45,
        label: 'Языковые модели загружены',
      };

    case 'initializing api':
      return {
        stage: 'loading',
        value: clampProgress(45 + progress * 5),
        label: 'Подготавливаем распознавание…',
      };

    case 'initialized api':
      return {
        stage: 'loading',
        value: 50,
        label: 'Начинаем распознавание…',
      };

    case 'recognizing text':
      return {
        stage: 'recognizing',
        value: clampProgress(50 + progress * 50),
        label: 'Распознаём текст чека…',
      };

    default:
      return {
        stage: 'loading',
        value: clampProgress(progress * 100),
        label: 'Обрабатываем изображение…',
      };
  }
}
async function createReceiptWorker(): Promise<Worker> {
  const { createWorker, OEM } = await import('tesseract.js');

  return createWorker(['rus', 'eng'], OEM.LSTM_ONLY, {
    logger(message) {
      activeProgressListener?.(normalizeProgress(message));
    },
  });
}

function getReceiptWorker(): Promise<Worker> {
  if (workerPromise === null) {
    workerPromise = createReceiptWorker().catch(error => {
      workerPromise = null;

      throw error;
    });
  }

  return workerPromise;
}

export async function recognizeReceipt(
  file: File,
  onProgress: TProgressListener
): Promise<IOcrResult> {
  if (isRecognitionInProgress) {
    throw new Error('Распознавание уже выполняется');
  }

  isRecognitionInProgress = true;
  activeProgressListener = onProgress;

  try {
    const worker = await getReceiptWorker();

    const result = await worker.recognize(file, {
      rotateAuto: true,
    });

    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Распознавание уже выполняется'
    ) {
      throw error;
    }

    throw new Error(
      'Не удалось распознать чек. Проверьте изображение и повторите попытку.'
    );
  } finally {
    activeProgressListener = null;
    isRecognitionInProgress = false;
  }
}

export async function terminateOcrWorker(): Promise<void> {
  const currentWorker = workerPromise;

  workerPromise = null;
  activeProgressListener = null;
  isRecognitionInProgress = false;

  if (currentWorker === null) {
    return;
  }

  const worker = await currentWorker;

  await worker.terminate();
}
