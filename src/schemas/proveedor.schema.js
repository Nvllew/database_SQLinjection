import { z } from 'zod';


const EstadoProveedor = z.enum(['ACTIVO', 'INACTIVO'], {
  errorMap: () => ({ message: "El estado solo puede ser 'ACTIVO' o 'INACTIVO'" })
});

export const createProveedorSchema = z.object({
  id_tienda: z.number({
    required_error: "El ID de la tienda es requerido",
    invalid_type_error: "El ID de la tienda debe ser un número válido",
  }).int().positive('El ID de tienda debe ser un número positivo'),
  
  
  id_categoria: z.number({
    invalid_type_error: "El ID de la categoría debe ser un número",
  }).int().positive('El ID de la categoría debe ser positivo')
    .optional()
    .nullable(),
  
  nombre: z.string({
    required_error: "El nombre es requerido",
  }).min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .trim(),
    
  telefono: z.string()
    .max(20, 'El teléfono no puede exceder los 20 caracteres')
    .optional()
    .nullable(),
    
  correo: z.string()
    .email('Formato de correo inválido')
    .toLowerCase() 
    .max(100, 'El correo no puede exceder los 100 caracteres')
    .optional()
    .nullable(),
    
  direccion: z.string()
    .max(150, 'La dirección no puede exceder los 150 caracteres')
    .optional()
    .nullable(),
    
  
  
  estado: EstadoProveedor.optional().default('ACTIVO'),
  
  tiempo_entregas: z.string()
    .max(50, 'El tiempo de entregas no puede exceder los 50 caracteres')
    .optional()
    .nullable(),
});

export const updateProveedorSchema = z.object({
  
  id_categoria: z.number({
    invalid_type_error: "El ID de la categoría debe ser un número",
  }).int().positive('El ID de la categoría debe ser positivo')
    .optional()
    .nullable(),

  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .trim()
    .optional(),
    
  telefono: z.string()
    .max(20, 'El teléfono no puede exceder los 20 caracteres')
    .optional()
    .nullable(),
    
  correo: z.string()
    .email('Formato de correo inválido')
    .toLowerCase()
    .max(100, 'El correo no puede exceder los 100 caracteres')
    .optional()
    .nullable(),
    
  direccion: z.string()
    .max(150, 'La dirección no puede exceder los 150 caracteres')
    .optional()
    .nullable(),
    
  
  estado: EstadoProveedor.optional(),
  
  tiempo_entregas: z.string()
    .max(50, 'El tiempo de entregas no puede exceder los 50 caracteres')
    .optional()
    .nullable(),
});