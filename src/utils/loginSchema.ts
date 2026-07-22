import { z } from 'zod';
import type { LoginFormValues } from '../types/auth';

export const loginSchema = z.object({
  username: z.string().min(1, 'İstifadəçi adı daxil edin.'),
  password: z.string().min(1, 'Şifrəni daxil edin.'),
  rememberMe: z.boolean(),
}) satisfies z.ZodType<LoginFormValues>;
