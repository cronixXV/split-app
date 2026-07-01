export type TOcrStage = 'loading' | 'recognizing' | 'done' | 'error';

export interface IOcrProgress {
  stage: TOcrStage;
  value: number;
  label: string;
}

export interface IOcrResult {
  text: string;
  confidence: number;
}
