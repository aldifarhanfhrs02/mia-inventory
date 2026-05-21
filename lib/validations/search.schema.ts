import { z } from "zod";

/** A single parsed row from an uploaded Part Search file. */
export const SearchRowSchema = z.object({
  row: z.number().int().positive(),
  partCode: z.string().default(""),
  partName: z.string().default(""),
  maker: z.string().default(""),
  qtyNeeded: z.number().int().min(0).default(0),
});

/** Full upload payload — capped at 500 rows per PRD-BACKEND SR-02. */
export const SearchUploadSchema = z.object({
  fileName: z.string().min(1),
  rows: z.array(SearchRowSchema).min(1).max(500, "Maksimum 500 baris per file"),
});

export type SearchRowValues = z.infer<typeof SearchRowSchema>;
export type SearchUploadValues = z.infer<typeof SearchUploadSchema>;
