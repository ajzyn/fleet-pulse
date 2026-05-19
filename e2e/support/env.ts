import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NEON_API_KEY: z.string().min(1),
  NEON_PROJECT_ID: z.string().min(1),
  NEON_PARENT_BRANCH_ID: z.string().min(1),
  DATABASE_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(z.prettifyError(parsed.error));
  throw new Error("Invalid e2e environment variables. see logs above");
}

export const env = parsed.data;
