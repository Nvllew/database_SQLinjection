import pool from "../config/db.js"; 

export const insertEvaluation = async (id_usuario, calificacion, comentario) => {
  const query = `
    INSERT INTO Evaluaciones (id_usuario, calificacion, comentario) 
    VALUES (?, ?, ?)
  `;
  const [result] = await pool.execute(query, [id_usuario, calificacion, comentario]);
  return result;
};

export const getPublicEvaluations = async () => {
  const query = `
    SELECT 
      e.id_evaluacion, 
      e.calificacion, 
      e.comentario, 
      e.fecha_creacion,
      u.nombre AS cliente_nombre,
      t.nombre AS tienda_nombre,
      t.direccion AS tienda_ubicacion
    FROM Evaluaciones e
    INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN Tiendas t ON u.id_tienda = t.id_tienda
    WHERE e.estado = 'APROBADA' AND e.calificacion >= 4
    ORDER BY e.fecha_creacion DESC
    LIMIT 6; -- Traemos solo las más recientes para no saturar la vista
  `;
  const [rows] = await pool.execute(query);
  return rows;
};