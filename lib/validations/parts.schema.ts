import { z } from "zod";

/** Create-part input. Mirrors PRD-BACKEND §8.1. */
export const CreatePartSchema = z
  .object({
    partName: z.string().min(1, "Part Name wajib diisi").max(200),
    partCode: z.string().min(1, "Part Code wajib diisi").max(50),
    maker: z.string().min(1, "Maker wajib diisi").max(100),
    type: z.enum(["Electrical", "Mechanical", "Fabrication"]),
    category: z.string().min(1, "Category wajib diisi").max(50),
    partClass: z
      .enum(["consumable", "existing_project", "new_part"])
      .default("consumable"),
    unit: z.string().min(1, "Unit wajib diisi").max(20),
    description: z.string().max(500).optional(),
    remarks: z.string().max(500).optional(),

    minStock: z.number().int().min(0),
    stdStock: z.number().int().min(0).optional(),
    maxStock: z.number().int().min(0).optional(),
    price: z.number().int().min(0).optional(),
    initialStock: z.number().int().min(0).default(0),

    storageType: z.enum(["A", "B"]).optional(),
    storageNumber: z.number().int().positive().optional(),
    storageBox: z.number().int().positive().optional(),
    storageBoxKecil: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.stdStock !== undefined && data.stdStock < data.minStock)
        return false;
      if (
        data.maxStock !== undefined &&
        data.stdStock !== undefined &&
        data.maxStock < data.stdStock
      )
        return false;
      if (data.maxStock !== undefined && data.maxStock < data.minStock)
        return false;
      return true;
    },
    { message: "min_stock ≤ std_stock ≤ max_stock", path: ["maxStock"] },
  )
  .refine(
    (data) => {
      // All four storage fields must be filled together, or none at all.
      const fields = [
        data.storageType,
        data.storageNumber,
        data.storageBox,
        data.storageBoxKecil,
      ];
      const filled = fields.filter((f) => f !== undefined);
      return filled.length === 0 || filled.length === 4;
    },
    {
      message:
        "Lokasi harus diisi lengkap (type, number, box, box kecil) atau tidak sama sekali",
      path: ["storageType"],
    },
  );

/** Update-part input — identical to create minus the initial stock. */
export const UpdatePartSchema = z
  .object({
    partName: z.string().min(1, "Part Name wajib diisi").max(200),
    partCode: z.string().min(1, "Part Code wajib diisi").max(50),
    maker: z.string().min(1, "Maker wajib diisi").max(100),
    type: z.enum(["Electrical", "Mechanical", "Fabrication"]),
    category: z.string().min(1, "Category wajib diisi").max(50),
    partClass: z
      .enum(["consumable", "existing_project", "new_part"])
      .default("consumable"),
    unit: z.string().min(1, "Unit wajib diisi").max(20),
    description: z.string().max(500).optional(),
    remarks: z.string().max(500).optional(),
    minStock: z.number().int().min(0),
    stdStock: z.number().int().min(0).optional(),
    maxStock: z.number().int().min(0).optional(),
    price: z.number().int().min(0).optional(),
    storageType: z.enum(["A", "B"]).optional(),
    storageNumber: z.number().int().positive().optional(),
    storageBox: z.number().int().positive().optional(),
    storageBoxKecil: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.stdStock !== undefined && data.stdStock < data.minStock)
        return false;
      if (
        data.maxStock !== undefined &&
        data.stdStock !== undefined &&
        data.maxStock < data.stdStock
      )
        return false;
      if (data.maxStock !== undefined && data.maxStock < data.minStock)
        return false;
      return true;
    },
    { message: "min_stock ≤ std_stock ≤ max_stock", path: ["maxStock"] },
  );

export type CreatePartValues = z.input<typeof CreatePartSchema>;
export type UpdatePartValues = z.input<typeof UpdatePartSchema>;
