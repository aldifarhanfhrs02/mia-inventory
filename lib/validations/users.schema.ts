import { z } from "zod";

/** NIK + password login. Error messages stay generic per PRD-BACKEND AR-10. */
export const LoginSchema = z.object({
  nik: z.string().min(1, "Employee ID is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

/** Create-user input. Mirrors PRD-BACKEND §8.3. */
export const CreateUserSchema = z.object({
  nik: z.string().min(3, "Employee ID must be at least 3 characters").max(20),
  fullName: z.string().min(1, "Name is required").max(100),
  role: z.enum(["admin", "user"]),
});

/** Update-user input — only fullName is editable; NIK is the immutable login id. */
export const UpdateUserSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(100),
});

/** Change-password input — old password optional on first login. */
export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1).optional(),
    newPassword: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[a-zA-Z]/, "Must contain letters")
      .regex(/[0-9]/, "Must contain numbers"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof LoginSchema>;
export type CreateUserValues = z.infer<typeof CreateUserSchema>;
export type UpdateUserValues = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;
