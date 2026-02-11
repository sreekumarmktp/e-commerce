import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  API_BASE_URL: z.string().url().default('http://localhost:3001')
});

export const env = envSchema.parse(process.env);

