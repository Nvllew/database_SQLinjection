import { crearEvaluacionSchema } from "../schemas/evaluations.schema.js";
import { createEvaluationService, getPublicEvaluationsService } from "../services/evaluations.service.js";


export const createEvaluation = async (req, res) => {
  try {
    
    const validatedData = crearEvaluacionSchema.parse(req.body);

    
    const userPayload = req.user; 
    const id_usuario = userPayload?.sub; 

    
    if (!id_usuario) {
      return res.status(401).json({
        success: false,
        message: "No se pudo identificar al usuario en el token de sesión."
      });
    }

    
    const result = await createEvaluationService(
      id_usuario, 
      validatedData.calificacion, 
      validatedData.comentario
    );

    
    res.status(201).json(result);

  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Por favor, revisa los datos ingresados.",
        errors: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor."
    });
  }
};

export const getPublicEvaluations = async (req, res) => {
  try {
    const result = await getPublicEvaluationsService();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al cargar las evaluaciones."
    });
  }
};