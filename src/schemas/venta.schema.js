import { z } from 'zod';

const detalleVentaSchema = z.object({
  id_producto: z
    .number({ required_error: "El ID del producto es obligatorio" })
    .int()
    .positive('ID de producto inválido'),
    
  cantidad: z
    .number({ required_error: "La cantidad es obligatoria" })
    .int()
    .positive('La cantidad debe ser mayor a 0'),
    
  precio_unitario_venta: z
    .number({ required_error: "El precio unitario es obligatorio" })
    .min(0, 'El precio no puede ser negativo')
});

export const createVentaSchema = z.object({
  id_tienda: z
    .number({ required_error: "El ID de la tienda es obligatorio" })
    .int()
    .positive('ID de tienda inválido'),
    
  id_usuario: z
    .number({ required_error: "El ID del cajero/usuario es obligatorio" })
    .int()
    .positive('ID de usuario inválido'),

  
  id_cliente: z
    .number({ required_error: "El ID del cliente es obligatorio" })
    .int()
    .positive('ID de cliente inválido'),

  metodo_pago: z
    .enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'], {
      required_error: "El método de pago es obligatorio",
      invalid_type_error: "Método de pago no válido (debe ser EFECTIVO, TARJETA o TRANSFERENCIA)"
    }),

  total: z
    .number({ required_error: "El total es obligatorio" })
    .min(0, 'El total no puede ser negativo')
    .optional(),

  detalles: z
    .array(detalleVentaSchema, { required_error: "Los detalles de la venta son obligatorios" })
    .min(1, 'La venta debe incluir al menos un producto en el carrito')
});
