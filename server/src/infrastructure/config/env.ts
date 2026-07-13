import { z } from 'zod';

const logLevelSchema = z.enum([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
]);

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

function parseOrigins(value: string): string[] {
  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
    .map(origin => new URL(origin).origin);
}
function isValidUrl(value: string): boolean {
  try {
    new URL(value);

    return true;
  } catch {
    return false;
  }
}

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid URL'),
  CLIENT_ORIGIN: z
    .string()
    .min(1, 'CLIENT_ORIGIN is required')
    .refine(
      value =>
        value
          .split(',')
          .map(origin => origin.trim())
          .filter(Boolean)
          .every(isValidUrl),
      'CLIENT_ORIGIN must contain valid URLs separated by comma'
    )
    .transform(parseOrigins),
  LOG_LEVEL: logLevelSchema.default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  ROOM_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CRON_CLEANUP_SCHEDULE: z.string().min(1).default('0 3 * * *'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const env = parsedEnv.data;

export const isProduction = env.NODE_ENV === 'production';

export const isDevelopment = env.NODE_ENV === 'development';
