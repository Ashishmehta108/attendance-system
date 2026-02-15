import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional().transform(Number),
  FRONTEND_ORIGIN: z.string().url().optional(),
  API_URL: z.string().url().optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export const env = envSchema.safeParse(process.env);
if (!env.success && process.env.NODE_ENV === "development") {
  console.warn("Env validation warning:", env.error.flatten());
}

export type Env = z.infer<typeof envSchema>;
