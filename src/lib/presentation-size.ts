import { z } from "zod";

export const presentationSizeSchema = z.number().positive().max(9_999).refine(
  (value) => Number.isInteger(value * 10),
  "La presentación puede tener como máximo un decimal.",
);
