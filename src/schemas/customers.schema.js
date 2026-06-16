import { z } from "zod";



const rfcRegex = /^[A-Z&Ññ]{3,4}\d{6}[A-V1-9][A-Z1-9]\d$/i;

export const createClienteSchema = z.object({
  id_tienda: z.number({
    required_error: "El id de la tienda es obligatorio",
    invalid_type_error: "El id de la tienda debe ser un número entero",
  }),
  nombre: z
    .string({
      required_error: "El nombre es obligatorio",
      invalid_type_error: "El nombre debe ser un texto",
    })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),

  direccion: z
    .string({
      required_error: "La dirección es obligatoria",
    })
    .min(5, "Ingresa una dirección más detallada")
    .max(150, "La dirección no puede exceder los 150 caracteres"),

  telefono: z
    .string({
      required_error: "El teléfono es obligatorio",
    })
    .regex(/^\d{10}$/, "El teléfono debe contener exactamente 10 dígitos"),

  
  email: z
    .string({
      required_error: "El correo es obligatorio",
    })
    .email("Ingresa un correo electrónico válido")
    .max(100, "El correo no puede exceder los 100 caracteres"),

  RFC: z
    .string()
    .regex(rfcRegex, "Formato de RFC inválido")
    .max(13, "El RFC no puede exceder los 13 caracteres")
    .nullable() 
    .optional() 
    .transform((val) => (val === "" ? null : val)), 
});

export const updateClienteSchema = z.object({
  id_tienda: z.number({
    required_error: "El id de la tienda es obligatorio",
    invalid_type_error: "El id de la tienda debe ser un número entero",
  }),
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres")
    .optional(),

  direccion: z
    .string()
    .min(5, "Ingresa una dirección más detallada")
    .max(150, "La dirección no puede exceder los 150 caracteres")
    .optional(),

  telefono: z
    .string()
    .regex(/^\d{10}$/, "El teléfono debe contener exactamente 10 dígitos")
    .optional(),

  email: z
    .string()
    .email("Ingresa un correo electrónico válido")
    .max(100, "El correo no puede exceder los 100 caracteres")
    .optional(),

  RFC: z
    .string()
    .regex(rfcRegex, "Formato de RFC inválido")
    .max(13, "El RFC no puede exceder los 13 caracteres")
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
});