import { z } from "zod";

export const crearEvaluacionSchema = z.object({
  calificacion: z
    .number({
      required_error: "La calificación es obligatoria.",
      invalid_type_error: "La calificación debe ser un número.",
    })
    .int("La calificación debe ser un número entero.")
    .min(1, "La calificación mínima es 1 estrella.")
    .max(5, "La calificación máxima es 5 estrellas."),

  comentario: z
    .string({
      required_error: "El comentario es obligatorio.",
      invalid_type_error: "El comentario debe ser texto.",
    })
    .min(10, "El comentario es muy corto, cuéntanos un poco más (mínimo 10 caracteres).")
    .max(1000, "El comentario es demasiado largo (máximo 1000 caracteres).")
    .trim(),
});