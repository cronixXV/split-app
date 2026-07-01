import { MAX_EXPENSE_AMOUNT } from '@shared/types';

interface ITotalMarker {
  pattern: RegExp;
  priority: number;
}

interface IAmountCandidate {
  amount: number;
  priority: number;
  lineIndex: number;
}

const TOTAL_MARKERS: ITotalMarker[] = [
  {
    pattern: /\bСУММА\s+К\s+ОПЛАТЕ\b/i,
    priority: 120,
  },
  {
    pattern: /\bК\s+ОПЛАТЕ\b/i,
    priority: 110,
  },
  {
    pattern: /\bAMOUNT\s+DUE\b/i,
    priority: 110,
  },
  {
    pattern: /\bИТОГО\b/i,
    priority: 100,
  },
  {
    pattern: /\bTOTAL\b/i,
    priority: 100,
  },
  {
    pattern: /\bИТОГ\b/i,
    priority: 95,
  },
  {
    pattern: /\bВСЕГО\b/i,
    priority: 80,
  },
];

const AMOUNT_TOKEN_PATTERN = /\d(?:[\d\s\u00a0.,]*\d)?/g;

const CURRENCY_PATTERN = /(?:₽|RUB|РУБ(?:ЛЕЙ|ЛЯ|ЛЬ|\.?)?)/i;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseReceiptAmount(rawValue: string): number | null {
  const value = rawValue.replace(/\s|\u00a0/g, '').replace(/[^\d.,]/g, '');

  if (!value || !/\d/.test(value)) {
    return null;
  }

  const separators = Array.from(value.matchAll(/[.,]/g));

  let normalizedValue: string;

  if (separators.length === 0) {
    normalizedValue = value;
  } else {
    const lastSeparator = separators.at(-1);

    if (!lastSeparator) {
      return null;
    }

    const separatorIndex = lastSeparator.index;

    const fractionLength = value.length - separatorIndex - 1;

    if (fractionLength === 1 || fractionLength === 2) {
      const integerPart = value.slice(0, separatorIndex).replace(/[.,]/g, '');

      const fractionPart = value.slice(separatorIndex + 1);

      normalizedValue = `${integerPart}.${fractionPart}`;
    } else {
      normalizedValue = value.replace(/[.,]/g, '');
    }
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_EXPENSE_AMOUNT) {
    return null;
  }

  return roundMoney(amount);
}

function extractAmounts(line: string): number[] {
  const tokens = line.match(AMOUNT_TOKEN_PATTERN) ?? [];

  return tokens
    .map(parseReceiptAmount)
    .filter((amount): amount is number => amount !== null);
}

function getMarkerPriority(line: string): number {
  return TOTAL_MARKERS.reduce((highestPriority, marker) => {
    if (!marker.pattern.test(line)) {
      return highestPriority;
    }

    return Math.max(highestPriority, marker.priority);
  }, 0);
}

export function parseReceiptTotal(text: string): number | null {
  const lines = text
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const candidates: IAmountCandidate[] = [];

  lines.forEach((line, lineIndex) => {
    const amounts = extractAmounts(line);

    if (amounts.length === 0) {
      return;
    }

    const markerPriority = getMarkerPriority(line);

    if (markerPriority > 0) {
      candidates.push({
        amount: Math.max(...amounts),
        priority: markerPriority,
        lineIndex,
      });

      return;
    }

    if (CURRENCY_PATTERN.test(line)) {
      candidates.push({
        amount: Math.max(...amounts),
        priority: 30,
        lineIndex,
      });
    }
  });

  candidates.sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    if (left.lineIndex !== right.lineIndex) {
      return right.lineIndex - left.lineIndex;
    }

    return right.amount - left.amount;
  });

  return candidates[0]?.amount ?? null;
}
