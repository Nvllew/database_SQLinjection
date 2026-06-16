import { insertEvaluation, getPublicEvaluations } from "../models/evaluations.model.js";


export const createEvaluationService = async (id_usuario, calificacion, comentario) => {
  try {
    const result = await insertEvaluation(id_usuario, calificacion, comentario);
    
    return {
      success: true,
      message: "¡Gracias por tu reseña! Ha sido enviada y está pendiente de revisión.",
      id_evaluacion: result.insertId
    };
  } catch (error) {    
    throw new Error("Ocurrió un error al intentar guardar la evaluación en la base de datos.");
  }
};


export const getPublicEvaluationsService = async () => {
  try {
    const evaluaciones = await getPublicEvaluations();

    
    const evaluacionesFormateadas = evaluaciones.map(ev => {
      
      
      const partesNombre = ev.cliente_nombre.trim().split(' ');
      let iniciales = partesNombre[0].charAt(0).toUpperCase();
      
      if (partesNombre.length > 1) {
        iniciales += partesNombre[1].charAt(0).toUpperCase();
      }

      
      const ubicacion = ev.tienda_ubicacion ? ev.tienda_ubicacion : 'México';

      return {
        id_evaluacion: ev.id_evaluacion,
        calificacion: ev.calificacion,
        comentario: ev.comentario,
        autor: ev.cliente_nombre,
        iniciales: iniciales,
        empresa: `${ev.tienda_nombre} · ${ubicacion}`, 
        fecha: ev.fecha_creacion
      };
    });

    return {
      success: true,
      data: evaluacionesFormateadas
    };
  } catch (error) {
    throw new Error("No se pudieron cargar los testimonios.");
  }
};