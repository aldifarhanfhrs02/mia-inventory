import { z } from "zod";

/** NIK + password login. Error messages stay generic per PRD-BACKEND AR-10. */
export const LoginSchema = z.object({
  nik: z.string().min(1, "NIK wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  remember: z.boolean().optional(),
});

/** Create-user input. Mirrors PRD-BACKEND §8.3. */
export const CreateUserSchema = z.object({
  nik: z.string().min(3, "NIK minimal 3 karakter").max(20),
  fullName: z.string().min(1, "Nama wajib diisi").max(100),
  role: z.enum(["admin", "user"]),
});

/** Change-password input — old password optional on first login. */
export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1).optional(),
    newPassword: z
      .string()
      .min(8, "Minimum 8 karakter")
      .regex(/[a-zA-Z]/, "Harus mengandung huruf")
      .regex(/[0-9]/, "Harus mengandung angka"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof LoginSchema>;
export type CreateUserValues = z.infer<typeof CreateUserSchema>;
export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;
