import { z } from "zod";

/** Stock IN / OUT input. Mirrors PRD-BACKEND §8.2. */
export const CreateMovementSchema = z.object({
  partIdentifier: z.string().min(1, "Scan barcode or Part Code"),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  requestor: z.string().min(1, "Requestor is required").max(100),
  project: z.string().max(200).optional(),
});

export type CreateMovementValues = z.infer<typeof CreateMovementSchema>;
