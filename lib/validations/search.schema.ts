import { z } from "zod";

/**
 * A single parsed row from an uploaded Part Search file.
 * A row is valid only when it has *some* identifier (Part Code OR Part Name)
 * and a positive quantity — otherwise there's nothing to match against.
 */
export const SearchRowSchema = z
  .object({
    row: z.number().int().positive(),
    partCode: z.string().default(""),
    partName: z.string().default(""),
    maker: z.string().default(""),
    qtyNeeded: z.number().int().min(0).default(0),
  })
  .refine((r) => r.partCode.trim().length > 0 || r.partName.trim().length > 0, {
    message: "Part Code or Part Name is required",
    path: ["partCode"],
  })
  .refine((r) => r.qtyNeeded > 0, {
    message: "Qty Needed must be greater than 0",
    path: ["qtyNeeded"],
  });

/** Full upload payload — capped at 500 rows per PRD-BACKEND SR-02. */
export const SearchUploadSchema = z.object({
  fileName: z.string().min(1),
  rows: z
    .array(SearchRowSchema)
    .min(1)
    .max(500, "Maximum 500 rows per file"),
});

export type SearchRowValues = z.infer<typeof SearchRowSchema>;
export type SearchUploadValues = z.infer<typeof SearchUploadSchema>;
