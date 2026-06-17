export const validateParamId = (paramName = 'id') => (req, res, next) => {
  const rawValue = req.params[paramName];
  const numericValue = Number(rawValue);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return res.status(400).json({
      message: `El parámetro ${paramName} debe ser un entero positivo.`
    });
  }

  req.params[paramName] = numericValue;
  next();
};
