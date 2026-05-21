import { z } from "zod";

/** Stock IN / OUT input. Mirrors PRD-BACKEND §8.2. */
export const CreateMovementSchema = z.object({
  partIdentifier: z.string().min(1, "Scan barcode atau Part Code"),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
  requestor: z.string().min(1, "Requestor wajib diisi").max(100),
  project: z.string().max(200).optional(),
});

export type CreateMovementValues = z.infer<typeof CreateMovementSchema>;
